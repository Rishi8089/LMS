import React, { useEffect, useState, useRef, useContext, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../config.js";
import getCurrentEmployee from "../customHook/getCurrentEmployee.js";
import { AuthContext } from "../context/authContext.jsx";
import { Loader2 } from "lucide-react";
import {
  FiMenu,
  FiX,
  FiCheckCircle,
  FiPlay,
  FiPause,
  FiSkipBack,
  FiSkipForward,
  FiMaximize,
  FiMinimize,
  FiFileText,
  FiZoomIn,
  FiZoomOut,
  FiRotateCcw,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

/* ================= HELPERS ================= */

function formatTime(sec) {
  if (!sec || Number.isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function parseDurationToSeconds(d) {
  if (!d) return 0;
  const p = String(d).split(":").map(Number);
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  if (p.length === 2) return p[0] * 60 + p[1];
  return p[0];
}

function isPdfFileDescriptor(file) {
  return typeof file === "string" && file.toLowerCase().endsWith(".pdf");
}

// PDF Page Component to prevent infinite re-renders
const PdfPage = React.memo(({ pageNum, renderPage }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      renderPage(pageNum, canvasRef.current);
    }
  }, [pageNum, renderPage]);

  return (
    <div className="shadow-lg">
      <canvas ref={canvasRef} className="bg-white" />
    </div>
  );
});

/* ================= COMPONENT ================= */

export default function Player() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useContext(AuthContext);
  const employee = getCurrentEmployee(isLoggedIn);

  /* ---------- refs ---------- */
  const videoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const pdfContainerRef = useRef(null); // Ref for custom PDF scroller
  const saveTimer = useRef(null);
  const isSeeking = useRef(false);
  const lastSavedPercent = useRef(0);

  const indicesRef = useRef({ cIdx: 0, lIdx: 0 });
  const isCompletedRef = useRef(false);

  /* ---------- state ---------- */
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Initialize from localStorage
  const [lessonProgress, setLessonProgress] = useState(() => {
    try {
      const saved = localStorage.getItem(`course_progress_${courseId}`);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [currentChapterIndex, setCurrentChapterIndex] = useState(() => {
    const saved = localStorage.getItem(`active_chapter_${courseId}`);
    return saved ? parseInt(saved, 10) : 0;
  });

  const [currentLessonIndex, setCurrentLessonIndex] = useState(() => {
    const saved = localStorage.getItem(`active_lesson_${courseId}`);
    return saved ? parseInt(saved, 10) : 0;
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [visualTimePercent, setVisualTimePercent] = useState(0);
  const [realVideoDuration, setRealVideoDuration] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openChapters, setOpenChapters] = useState({});
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // PDF.js State
  const [pdfLibLoaded, setPdfLibLoaded] = useState(false);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pdfPages, setPdfPages] = useState([]);
  const [pdfScale, setPdfScale] = useState(1.0);
  const [renderingPages, setRenderingPages] = useState(new Set()); // Track pages currently being rendered
  const [renderedPages, setRenderedPages] = useState(new Set()); // Track pages that have been rendered
  const [pdfError, setPdfError] = useState(null); // PDF loading/rendering errors
  const [currentPdfPage, setCurrentPdfPage] = useState(1); // Current page for navigation
  const [totalPdfPages, setTotalPdfPages] = useState(0);
  const [pdfZoomControls, setPdfZoomControls] = useState(false); // Show zoom controls
  const [pdfNavigationVisible, setPdfNavigationVisible] = useState(false); // Show page navigation

  const progressKey = `${currentChapterIndex}-${currentLessonIndex}`;
  const currentLesson =
    course?.chapters?.[currentChapterIndex]?.lessons?.[currentLessonIndex];
  const isPDF = isPdfFileDescriptor(currentLesson?.video);

  /* ================= EFFECTS & SETUP ================= */

  // Load PDF.js from CDN
  useEffect(() => {
    if (window.pdfjsLib) {
      setPdfLibLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      setPdfLibLoaded(true);
    };
    document.body.appendChild(script);
  }, []);

  // Update indices ref & localStorage
  useEffect(() => {
    indicesRef.current = { cIdx: currentChapterIndex, lIdx: currentLessonIndex };
    localStorage.setItem(`active_chapter_${courseId}`, currentChapterIndex);
    localStorage.setItem(`active_lesson_${courseId}`, currentLessonIndex);
  }, [currentChapterIndex, currentLessonIndex, courseId]);

  // Persist progress
  useEffect(() => {
    if (Object.keys(lessonProgress).length > 0) {
      localStorage.setItem(`course_progress_${courseId}`, JSON.stringify(lessonProgress));
    }
  }, [lessonProgress, courseId]);

  // Load PDF Document when isPDF becomes true
  useEffect(() => {
    if (!isPDF || !pdfLibLoaded || !currentLesson?.video) return;

    const loadPdf = async () => {
      setIsLoadingVideo(true);
      setPdfPages([]);
      setPdfDoc(null);
      setPdfError(null);
      setRenderedPages(new Set()); // Reset rendered pages
      setCurrentPdfPage(1);
      setTotalPdfPages(0);

      try {
        const url = currentLesson.video.startsWith("/uploads")
          ? `${serverUrl}${currentLesson.video}`
          : currentLesson.video;

        const loadingTask = window.pdfjsLib.getDocument(url);
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        setTotalPdfPages(doc.numPages);

        // Create array of page numbers [1, 2, 3...]
        const pages = Array.from({ length: doc.numPages }, (_, i) => i + 1);
        setPdfPages(pages);
      } catch (error) {
        console.error("Error loading PDF:", error);
        setPdfError(error.message || "Failed to load PDF");
      } finally {
        setIsLoadingVideo(false);
      }
    };

    loadPdf();
  }, [isPDF, pdfLibLoaded, currentLesson]);

  // Restore PDF scroll position after all pages are rendered
  useEffect(() => {
    if (!isPDF || !pdfDoc || pdfPages.length === 0 || renderedPages.size !== pdfPages.length) return;

    const savedData = lessonProgress[progressKey];
    const savedPercent = savedData?.progress || 0;

    if (savedPercent > 0) {
      const container = pdfContainerRef.current;
      if (container) {
        // Use setTimeout to ensure layout is updated
        setTimeout(() => {
          const scrollHeight = container.scrollHeight;
          const scrollTop = (savedPercent / 100) * scrollHeight - container.clientHeight;
          container.scrollTop = Math.max(0, scrollTop);
          setVisualTimePercent(savedPercent);
          lastSavedPercent.current = Math.floor(savedPercent);
        }, 0);
      }
    }
  }, [isPDF, pdfDoc, pdfPages, renderedPages, lessonProgress, progressKey]);

  // Restore PDF scroll position when progress changes (e.g., after save at 100%)
  useEffect(() => {
    if (!isPDF) return;
    const savedData = lessonProgress[progressKey];
    const savedPercent = savedData?.progress || 0;

    if (savedPercent > 0) {
      const container = pdfContainerRef.current;
      if (container) {
        setTimeout(() => {
          const scrollHeight = container.scrollHeight;
          const scrollTop = (savedPercent / 100) * scrollHeight - container.clientHeight;
          container.scrollTop = Math.max(0, scrollTop);
        }, 0);
      }
    }
  }, [lessonProgress, progressKey, isPDF]);

  // Render PDF Pages
  const renderPage = useCallback(
    async (pageNum, canvasRef) => {
      if (!pdfDoc || !canvasRef || renderingPages.has(pageNum) || renderedPages.has(pageNum)) return;

      setRenderingPages(prev => new Set(prev).add(pageNum));

      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: pdfScale });
        const canvas = canvasRef;
        const context = canvas.getContext("2d");

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        setRenderedPages(prev => new Set(prev).add(pageNum));
      } catch (err) {
        console.error("Page render error:", err);
      } finally {
        setRenderingPages(prev => {
          const newSet = new Set(prev);
          newSet.delete(pageNum);
          return newSet;
        });
      }
    },
    [pdfDoc, pdfScale, renderingPages, renderedPages]
  );

  /* ================= PROGRESS LOGIC ================= */

  const overallProgress = useMemo(() => {
    if (!course?.chapters) return 0;
    const totalLessons = course.chapters.reduce(
      (acc, ch) => acc + ch.lessons.length, 0
    );
    if (totalLessons === 0) return 0;

    let totalProgressSum = 0;
    course.chapters.forEach((ch, cIdx) => {
      ch.lessons.forEach((l, lIdx) => {
        const key = `${cIdx}-${lIdx}`;
        const p = lessonProgress[key]?.progress || 0;
        totalProgressSum += Math.min(100, Math.max(0, p));
      });
    });
    return Math.round(totalProgressSum / totalLessons);
  }, [course, lessonProgress]);

  const refreshProgress = useCallback(async () => {
    if (!employee) return;
    try {
      const pRes = await axios.get(
        `${serverUrl}/api/employee/enrolled-courses`,
        { withCredentials: true }
      );
      const enrolled = pRes.data.courses.find(
        (c) => c?.course?._id === courseId || c?.course === courseId
      );
      if (enrolled?.lessonProgress) {
        const map = {};
        enrolled.lessonProgress.forEach((p) => {
          const safeProgress = Math.max(0, Math.min(100, p.progress || 0));
          map[`${p.chapterIndex}-${p.lessonIndex}`] = {
            progress: safeProgress,
            completed: safeProgress >= 100,
            chapterIndex: p.chapterIndex,
            lessonIndex: p.lessonIndex,
          };
        });
        setLessonProgress(map);
      }
    } catch (error) {
      console.error("Failed to refresh progress:", error);
    }
  }, [employee, courseId]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const cRes = await axios.get(`${serverUrl}/api/courses/${courseId}`, {
          withCredentials: true,
        });
        setCourse(cRes.data.course);

        if (employee) {
          const pRes = await axios.get(
            `${serverUrl}/api/employee/enrolled-courses`,
            { withCredentials: true }
          );
          const enrolled = pRes.data.courses.find(
            (c) => c?.course?._id === courseId || c?.course === courseId
          );
          if (enrolled?.lessonProgress) {
            const map = {};
            enrolled.lessonProgress.forEach((p) => {
              const safeProgress = Math.max(0, Math.min(100, p.progress || 0));
              map[`${p.chapterIndex}-${p.lessonIndex}`] = {
                progress: safeProgress,
                completed: safeProgress >= 100,
                chapterIndex: p.chapterIndex,
                lessonIndex: p.lessonIndex,
              };
            });
            setLessonProgress((prev) => ({ ...prev, ...map }));
          }
        }
      } catch (e) {
        console.error("Error loading course data:", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [courseId, employee?._id]);

  const isCourseCompleted = useCallback(() => {
    if (!course?.chapters) return false;
    for (let c = 0; c < course.chapters.length; c++) {
      const chapter = course.chapters[c];
      for (let l = 0; l < chapter.lessons.length; l++) {
        const key = `${c}-${l}`;
        const data = lessonProgress[key];
        if (!data || data.progress < 100) return false;
      }
    }
    return true;
  }, [course, lessonProgress]);

  /* ================= NAV & SAVE ================= */

  const prevLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex((i) => i - 1);
    } else if (currentChapterIndex > 0) {
      setCurrentChapterIndex((i) => i - 1);
      setCurrentLessonIndex(
        course.chapters[currentChapterIndex - 1].lessons.length - 1
      );
    }
  };

  const nextLesson = () => {
    const chapter = course.chapters[currentChapterIndex];
    if (currentLessonIndex < chapter.lessons.length - 1) {
      setCurrentLessonIndex((i) => i + 1);
    } else if (currentChapterIndex < course.chapters.length - 1) {
      setCurrentChapterIndex((i) => i + 1);
      setCurrentLessonIndex(0);
    }
  };

  const selectLesson = (cIdx, lIdx) => {
    setCurrentChapterIndex(cIdx);
    setCurrentLessonIndex(lIdx);
    setIsPlaying(false);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const toggleChapter = (cIdx) => {
    setOpenChapters((prev) => ({ ...prev, [cIdx]: !prev[cIdx] }));
  };

  const expandAllChapters = () => {
    const allOpen = {};
    course?.chapters.forEach((_, idx) => (allOpen[idx] = true));
    setOpenChapters(allOpen);
  };

  const collapseAllChapters = () => setOpenChapters({});

  const saveProgress = useCallback(
    (percent, force = false) => {
      clearTimeout(saveTimer.current);
      const shouldSaveImmediately = force || percent >= 100;
      const { cIdx, lIdx } = indicesRef.current;
      const currentKey = `${cIdx}-${lIdx}`;

      saveTimer.current = setTimeout(() => {
        setLessonProgress((prev) => {
          const existing = prev[currentKey];
          const oldProgress = existing?.progress || 0;
          const newMaxProgress = Math.max(oldProgress, percent);

          if (newMaxProgress > oldProgress || force) {
            axios
              .post(
                `${serverUrl}/api/employee/update-lesson-progress`,
                {
                  employeeId: employee._id,
                  courseId,
                  chapterIndex: cIdx,
                  lessonIndex: lIdx,
                  progress: newMaxProgress,
                  completed: newMaxProgress >= 100,
                },
                { withCredentials: true }
              )
              .then((response) => {
                if (response.data.courseProgress?.progress >= 100) {
                  axios
                    .get(`${serverUrl}/api/courses/${courseId}`, {
                      withCredentials: true,
                    })
                    .then((res) => setCourse(res.data.course))
                    .catch((e) =>
                      console.error("Failed to refresh course data:", e)
                    );
                }
              })
              .catch((e) => console.error("Save progress failed", e));
          }

          return {
            ...prev,
            [currentKey]: {
              chapterIndex: cIdx,
              lessonIndex: lIdx,
              progress: newMaxProgress,
              completed: newMaxProgress >= 100,
            },
          };
        });
      }, shouldSaveImmediately ? 0 : 1500);
    },
    [employee, courseId]
  );

  /* ================= EVENTS ================= */

  // Video Restore
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentLesson || isPDF) return;

    const savedData = lessonProgress[progressKey];
    const savedPercent = savedData?.progress || 0;

    setVisualTimePercent(savedPercent);
    lastSavedPercent.current = Math.floor(savedPercent);
    setIsLoadingVideo(true);

    const resumeVideo = () => {
      if (video.duration) {
        if (savedPercent > 0 && savedPercent < 100) {
          video.currentTime = (savedPercent / 100) * video.duration;
        } else {
          video.currentTime = 0;
        }
      }
      setIsLoadingVideo(false);
    };

    if (video.readyState >= 1) resumeVideo();
    else video.addEventListener("loadedmetadata", resumeVideo, { once: true });
  }, [progressKey, currentLesson, isPDF, lessonProgress]);

  // PDF Scroll Tracker
  const handlePdfScroll = useCallback(() => {
    const container = pdfContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // Calculate percentage
    const scrolled = scrollTop + clientHeight;
    const rawPercent = (scrolled / scrollHeight) * 100;
    const newPercent = Math.min(100, rawPercent);

    // Be lenient: if user is within 50px of bottom, call it 100%
    const isAtBottom = scrollHeight - scrolled <= 50;
    const finalPercent = isAtBottom ? 100 : newPercent;

    // Prevent progress from decreasing after completion
    if (isCompletedRef.current && finalPercent < 100) {
      return;
    }

    setVisualTimePercent(finalPercent);

    if (Math.floor(finalPercent) > lastSavedPercent.current) {
      lastSavedPercent.current = Math.floor(finalPercent);
      saveProgress(finalPercent);
    }

    if (finalPercent >= 100 && !isCompletedRef.current) {
      isCompletedRef.current = true;
      saveProgress(100, true);
    }
  }, [saveProgress]);

  // Video Events
  const togglePlay = useCallback(async () => {
    const v = videoRef.current;
    if (!v || v.readyState < 1) return;
    try {
      if (v.paused) {
        await v.play();
        setIsPlaying(true);
      } else {
        v.pause();
        setIsPlaying(false);
      }
    } catch (e) { console.error("Play failed", e); }
  }, []);

  const seekToPercent = useCallback((percent) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    isSeeking.current = true;
    v.currentTime = (percent / 100) * v.duration;
    setVisualTimePercent(percent);
    lastSavedPercent.current = Math.floor(percent);
    setTimeout(() => { isSeeking.current = false; }, 100);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v || isSeeking.current) return;
    const rawPercent = (v.currentTime / v.duration) * 100;
    const newPercent = Math.min(100, rawPercent);
    setVisualTimePercent(newPercent);
    if (Math.floor(newPercent) > lastSavedPercent.current) {
      lastSavedPercent.current = Math.floor(newPercent);
      saveProgress(newPercent);
    }
  }, [saveProgress]);

  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
    setVisualTimePercent(100);
    saveProgress(100, true);
  }, [saveProgress]);

  const toggleFullscreen = () => {
    const el = videoContainerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch((e) => console.error(e));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch((e) => console.error(e));
    }
  };

  const displayCourseDuration = () => {
    if (!course?.chapters) return "0 min";
    let totalSeconds = 0;
    course.chapters.forEach((ch) => {
      ch.lessons.forEach((l) => { if (l.duration) totalSeconds += parseDurationToSeconds(l.duration); });
    });
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;
  };

  const displayLessonDuration = () => {
    if (!currentLesson) return "0:00";
    if (realVideoDuration && !isPDF) return formatTime(realVideoDuration);
    return currentLesson.duration || "0:00";
  };

  // PDF Zoom Functions
  const zoomIn = () => {
    setPdfScale(prev => Math.min(prev + 0.25, 5));
  };

  const zoomOut = () => {
    setPdfScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setPdfScale(1.5);
  };

  // PDF Page Navigation
  const goToPrevPage = () => {
    if (currentPdfPage > 1) {
      setCurrentPdfPage(prev => prev - 1);
      // Scroll to the page
      const container = pdfContainerRef.current;
      if (container) {
        const pageHeight = container.scrollHeight / totalPdfPages;
        container.scrollTop = (currentPdfPage - 2) * pageHeight;
      }
    }
  };

  const goToNextPage = () => {
    if (currentPdfPage < totalPdfPages) {
      setCurrentPdfPage(prev => prev + 1);
      // Scroll to the page
      const container = pdfContainerRef.current;
      if (container) {
        const pageHeight = container.scrollHeight / totalPdfPages;
        container.scrollTop = currentPdfPage * pageHeight;
      }
    }
  };

  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPdfPages) {
      setCurrentPdfPage(pageNum);
      const container = pdfContainerRef.current;
      if (container) {
        const pageHeight = container.scrollHeight / totalPdfPages;
        container.scrollTop = (pageNum - 1) * pageHeight;
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-2" />
          <p className="text-black font-medium">Loading course content...</p>
        </div>
      </div>
    );
  }

  if (!course) return <div className="p-10 text-center text-black">Course not found.</div>;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white text-black">
      <header className="sticky top-0 z-20 px-4 py-3 shadow-sm bg-white border-b">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-black truncate max-w-[200px] sm:max-w-md">
              {course.title}
            </h1>
            <p className="text-xs text-gray-600 hidden sm:block">
              {course.chapters?.length} chapters • {displayCourseDuration()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-md hover:bg-orange-50 text-black border border-orange-200">
              <FiMenu size={24} />
            </button>
            <button onClick={() => navigate(-1)} className="text-sm font-medium text-black hover:text-orange-500">
              Exit
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative max-w-full overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-5xl mx-auto">
            <div
              ref={videoContainerRef}
              className="relative w-full bg-black rounded-xl overflow-hidden shadow-xl aspect-video group"
            >
              {currentLesson?.video ? (
                isPDF ? (
                  /* --- PDF VIEWER (Custom Scrollable) --- */
                  <div 
                    ref={pdfContainerRef}
                    onScroll={handlePdfScroll}
                    className="w-full h-full bg-gray-100 overflow-y-auto relative"
                  >
                    {pdfDoc ? (
                      <div className="flex flex-col items-center py-4 space-y-4">
                        {pdfPages.map((pageNum) => (
                          <PdfPage key={pageNum} pageNum={pageNum} renderPage={renderPage} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        Loading PDF...
                      </div>
                    )}

                    {/* PDF Overlay Progress */}
                    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/80 px-4 py-2 rounded-full text-white text-xs font-medium pointer-events-none z-50 shadow-lg">
                      <span className="flex items-center gap-2">
                        <FiFileText size={14} />
                        {Math.round(visualTimePercent)}% Read
                      </span>
                    </div>



                    {/* PDF Error Display */}
                    {pdfError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-50 border border-red-200 rounded-lg m-4">
                        <div className="text-center p-6">
                          <div className="text-red-600 text-lg font-semibold mb-2">PDF Loading Error</div>
                          <div className="text-red-500 text-sm">{pdfError}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* --- VIDEO PLAYER --- */
                  <>
                    <video
                      key={currentLesson.video}
                      ref={videoRef}
                      src={
                        currentLesson.video.startsWith("/uploads")
                          ? `${serverUrl}${currentLesson.video}`
                          : currentLesson.video
                      }
                      className="w-full h-full object-contain"
                      preload="auto"
                      playsInline
                      onClick={togglePlay}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={() => {
                        if (videoRef.current) {
                          setRealVideoDuration(videoRef.current.duration);
                          videoRef.current.playbackRate = speed;
                        }
                      }}
                      onEnded={handleVideoEnded}
                      onPlay={() => { setIsPlaying(true); setIsLoadingVideo(false); }}
                      onPause={() => setIsPlaying(false)}
                      onLoadStart={() => setIsLoadingVideo(true)}
                      onCanPlay={() => setIsLoadingVideo(false)}
                      onWaiting={() => setIsLoadingVideo(true)}
                      onPlaying={() => setIsLoadingVideo(false)}
                      onError={(e) => { console.error("Video Error:", e); setIsLoadingVideo(false); }}
                    />

                    {isLoadingVideo && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none z-10">
                        <Loader2 className="w-10 h-10 text-orange-400 animate-spin" />
                      </div>
                    )}

                    {!isPlaying && !isLoadingVideo && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/50 p-4 rounded-full backdrop-blur-sm border border-orange-400">
                          <FiPlay className="w-8 h-8 text-orange-400 ml-1" />
                        </div>
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 py-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                      <div
                        className="relative w-full h-1.5 bg-gray-700/70 rounded-full cursor-pointer hover:h-2 transition-all mb-4"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const percent = ((e.clientX - rect.left) / rect.width) * 100;
                          seekToPercent(percent);
                        }}
                      >
                        <div
                          className="absolute top-0 left-0 h-full bg-orange-400 rounded-full transition-[width] duration-100 ease-linear"
                          style={{ width: `${visualTimePercent}%` }}
                        >
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow scale-0 group-hover:scale-100 transition-transform" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-4">
                          <button onClick={togglePlay} className="hover:text-orange-400 transition-colors">
                            {isPlaying ? <FiPause size={20} /> : <FiPlay size={20} />}
                          </button>
                          <div className="flex items-center gap-1 text-xs font-mono text-gray-200">
                            <span>{videoRef.current ? formatTime(videoRef.current.currentTime) : "0:00"}</span>
                            <span>/</span>
                            <span>{displayLessonDuration()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="relative group/speed">
                            <button className="text-xs font-bold hover:text-orange-300 w-8">{speed}x</button>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/speed:flex flex-col bg-black/90 rounded p-1 border border-gray-700">
                              {[0.5, 1, 1.5, 2].map((s) => (
                                <button
                                  key={s}
                                  onClick={() => {
                                    setSpeed(s);
                                    if (videoRef.current) videoRef.current.playbackRate = s;
                                  }}
                                  className={`px-2 py-1 text-xs hover:bg-white/10 rounded ${speed === s ? "text-orange-300" : "text-white"}`}
                                >
                                  {s}x
                                </button>
                              ))}
                            </div>
                          </div>
                          <button onClick={toggleFullscreen} className="hover:text-orange-400">
                            {isFullscreen ? <FiMinimize size={20} /> : <FiMaximize size={20} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                  Select a lesson to start
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6">
              <div>
                <h2 className="text-xl font-bold text-black mb-1">
                  {currentLesson?.title || "Welcome to the Course"}
                </h2>
                <p className="text-gray-600 text-sm">
                  Chapter {currentChapterIndex + 1} • Lesson {currentLessonIndex + 1}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={prevLesson}
                  disabled={currentChapterIndex === 0 && currentLessonIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium bg-white text-black hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiSkipBack /> Previous
                </button>
                <button
                  onClick={nextLesson}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg:black bg-black text-white text-sm font-medium hover:bg-gray-900"
                >
                  Next <FiSkipForward />
                </button>
              </div>
            </div>
          </div>
        </main>

        <aside
          className={`
            fixed inset-y-0 right-0 z-30 w-80 bg-white border-l shadow-2xl transform transition-transform duration-300 lg:translate-x-0 lg:static lg:shadow-none
            ${sidebarOpen ? "translate-x-0" : "translate-x-full"}
          `}
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-black">Course Content</h3>
                <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-black">
                  <FiX size={20} />
                </button>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span className="font-medium text-orange-700">{overallProgress}% Completed</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200">
                <div 
                  className="bg-orange-500 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              <div className="flex justify-end gap-2 mb-2 px-2">
                <button onClick={expandAllChapters} className="text-xs text-orange-600 font-medium hover:underline">Expand All</button>
                <span className="text-gray-300">|</span>
                <button onClick={collapseAllChapters} className="text-xs text-orange-600 font-medium hover:underline">Collapse All</button>
              </div>

              {course.chapters?.map((chapter, cIdx) => {
                const isOpen = openChapters[cIdx];
                return (
                  <div key={cIdx} className="mb-2 border rounded-lg overflow-hidden bg-white">
                    <button
                      onClick={() => toggleChapter(cIdx)}
                      className="w-full flex items-center justify-between p-3 bg-orange-50 hover:bg-orange-100 transition-colors text-left"
                    >
                      <div>
                        <span className="text-xs font-bold text-orange-700 uppercase tracking-wider">Chapter {cIdx + 1}</span>
                        <div className="text-sm font-semibold text-black">{chapter.title}</div>
                      </div>
                      <span className="text-orange-500 text-lg">{isOpen ? "-" : "+"}</span>
                    </button>

                    {isOpen && (
                      <div className="divide-y">
                        {chapter.lessons.map((lesson, lIdx) => {
                          const key = `${cIdx}-${lIdx}`;
                          const data = lessonProgress[key];
                          const percent = Math.round(data?.progress || 0);
                          const isCompleted = percent >= 100;
                          const isActive = cIdx === currentChapterIndex && lIdx === currentLessonIndex;

                          return (
                            <button
                              key={lIdx}
                              onClick={() => selectLesson(cIdx, lIdx)}
                              className={`w-full flex items-start gap-3 p-3 transition-colors text-left ${isActive ? "bg-orange-50 border-l-4 border-orange-500" : "hover:bg-gray-50 border-l-4 border-transparent"}`}
                            >
                              <div className="mt-0.5">
                                {isCompleted ? (
                                  <FiCheckCircle className="text-green-500 w-4 h-4" />
                                ) : (
                                  <div className={`w-4 h-4 rounded-full border-2 ${isActive ? "border-orange-500" : "border-gray-300"}`} />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className={`text-sm ${isActive ? "font-bold text-black" : "text-gray-800"}`}>{lesson.title}</div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs text-gray-500">{lesson.duration || "0:00"}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isCompleted ? "bg-green-100 text-green-700" : percent > 0 ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-400"}`}>
                                    {percent}%
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {isCourseCompleted() && course.quiz && course.quiz.published && (
                <div className="mt-6 mb-10 px-2">
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl text-center">
                    <h4 className="font-bold text-orange-800 mb-1">Course Completed!</h4>
                    <p className="text-xs text-orange-700 mb-3">You have finished all lessons.</p>
                    <button onClick={() => navigate(`/quiz/${courseId}`)} className="w-full py-2.5 bg-black hover:bg-gray-900 text-white rounded-lg font-semibold shadow-md transition-all flex items-center justify-center gap-2">
                      <FiCheckCircle /> Take Final Quiz
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-20 bg-black/50 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        )}
      </div>
    </div>
  );
}