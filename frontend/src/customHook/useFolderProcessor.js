import { useState, useCallback } from "react";

/**
 * Custom hook to handle the course structure state and parsing logic.
 * Ensures natural, ascending ordering for chapters and lessons (1, 2, 10).
 */
const useFolderProcessor = () => {
  const [courseData, setCourseData] = useState({
    title: null,
    chapters: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getFileType = (fileName) => {
    const ext = (fileName.split(".").pop() || "").toLowerCase();
    switch (ext) {
      case "pdf":
        return "PDF Document";
      case "md":
      case "txt":
        return "Text/Markdown";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return "Image File";
      case "js":
      case "ts":
      case "html":
        return "Code File";
      case "mp4":
      case "mov":
      case "webm":
      case "mkv":
        return "Video File";
      default:
        return "Unknown File";
    }
  };

  // Helper: extract leading numeric prefix (e.g. "01 - Intro" -> 1)
  const extractLeadingNumber = (str) => {
    if (!str) return null;
    const m = str.match(/^\s*0*([0-9]+)\b/);
    if (m && m[1]) return parseInt(m[1], 10);
    return null;
  };

  // Natural comparator: numeric prefix -> collator -> fallback string compare
  const makeNaturalComparator = () => {
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
    return (aStr, bStr) => {
      // aStr and bStr are strings (path or name)
      const aNum = extractLeadingNumber(aStr);
      const bNum = extractLeadingNumber(bStr);

      if (aNum !== null && bNum !== null) {
        if (aNum < bNum) return -1;
        if (aNum > bNum) return 1;
        // if equal numeric prefix, fall through to collator
      } else if (aNum !== null) {
        // put numeric-prefixed before non-numeric
        return -1;
      } else if (bNum !== null) {
        return 1;
      }

      return collator.compare(aStr, bStr);
    };
  };

  const processFolder = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setError(null);
    setCourseData({ title: null, chapters: [] });

    try {
      const chapterMap = new Map();
      let mainCourseTitle = "";

      // Build chapter map (insertion order)
      for (const file of files) {
        const path = file.webkitRelativePath || file.relativePath || file.name;
        const parts = path.split("/").filter((p) => p.length > 0);

        // Expect CourseFolder/ChapterFolder/LessonFile.ext (min 3 parts)
        if (parts.length < 3) continue;

        // Only process video files as lessons
        const fileType = file.type || "";
        if (!fileType.startsWith("video/")) continue;

        if (!mainCourseTitle) mainCourseTitle = parts[0];
        const chapterName = parts[1];
        const lessonPath = parts.slice(2).join("/");
        const lessonFileName = file.name;

        const lesson = {
          name: lessonFileName,
          type: getFileType(lessonFileName),
          path: lessonPath,
          file,
        };

        if (!chapterMap.has(chapterName)) {
          chapterMap.set(chapterName, { name: chapterName, lessons: [] });
        }
        chapterMap.get(chapterName).lessons.push(lesson);
      }

      const comparator = makeNaturalComparator();

      // Convert to array and sort chapters & lessons ascending
      const chaptersArray = Array.from(chapterMap.values())
        .map((chapter) => {
          const sortedLessons = chapter.lessons.slice().sort((a, b) => {
            // Compare using path first (keeps nested folder ordering), then filename
            const cmpPath = comparator(a.path, b.path);
            if (cmpPath !== 0) return cmpPath;
            return comparator(a.name, b.name);
          });
          return { ...chapter, lessons: sortedLessons };
        })
        // sort chapters ascending as well (by chapter folder name)
        .sort((a, b) => comparator(a.name, b.name));

      if (chaptersArray.length === 0) {
        setError(
          "No valid Chapter/Lesson structure (Course/Chapter/Lesson) found in the selected folder."
        );
      }

      setCourseData({
        title: mainCourseTitle || "Processed Course",
        chapters: chaptersArray,
      });
    } catch (e) {
      console.error("Error processing folder:", e);
      setError("Failed to process folder structure. See console for details.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFileChange = useCallback(
    (event) => {
      const files = event?.target?.files;
      if (files) processFolder(files);
    },
    [processFolder]
  );

  return { courseData, isLoading, error, handleFileChange, setCourseData };
};

export default useFolderProcessor;
