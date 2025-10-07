import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { serverUrl } from '../config.js';

const Player = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await axios.get(`${serverUrl}/api/courses/${courseId}`, {
          withCredentials: true,
        });
        if (response.data.success) {
          setCourse(response.data.course);
        }
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500 font-semibold">
        Loading player...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500 font-semibold">
        Course not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen p-10 ml-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">{course.title}</h1>
      <p className="text-gray-600 mb-6">{course.description}</p>
      {/* Placeholder for video player */}
      <div className="bg-gray-200 h-120 w-200 flex items-center justify-center rounded-lg">
        <img src= {course.images} alt="video player" className='h-full'/>
        {/* <p className="text-gray-500">Video Player Placeholder</p> */}
      </div>
    </div>
  );
};

export default Player;
