import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { serverUrl } from '../../config.js';
import { toast } from 'react-toastify';

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    hours: '',
    difficulty: 'Beginner',
    mandatory: false,
    images: ''
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${serverUrl}/api/courses`, { withCredentials: true });
      if (response.data.success) {
        setCourses(response.data.courses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await axios.post(`${serverUrl}/api/courses`, formData, { withCredentials: true });
      if (response.data.success) {
        toast.success('Course created successfully');
        setShowForm(false);
        setFormData({
          title: '',
          description: '',
          hours: '',
          difficulty: 'Beginner',
          mandatory: false,
          images: ''
        });
        fetchCourses();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Creation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await axios.delete(`${serverUrl}/api/courses/${id}`, { withCredentials: true });
        toast.success('Course deleted');
        fetchCourses();
      } catch (error) {
        toast.error('Deletion failed');
      }
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Manage Courses</h1>
      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
      >
        {showForm ? 'Cancel' : 'Add Course'}
      </button>
      {showForm && (
        <div className="bg-white p-4 rounded shadow mb-4">
          <input
            type="text"
            placeholder="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="border p-2 mr-2 mb-2 w-full"
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="border p-2 mr-2 mb-2 w-full"
          />
          <input
            type="number"
            placeholder="Hours"
            value={formData.hours}
            onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
            className="border p-2 mr-2 mb-2"
          />
          <select
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
            className="border p-2 mr-2 mb-2"
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Hard</option>
          </select>
          <label className="mr-2">
            <input
              type="checkbox"
              checked={formData.mandatory}
              onChange={(e) => setFormData({ ...formData, mandatory: e.target.checked })}
            />
            Mandatory
          </label>
          <input
            type="text"
            placeholder="Image URL"
            value={formData.images}
            onChange={(e) => setFormData({ ...formData, images: e.target.value })}
            className="border p-2 mr-2 mb-2 w-full"
          />
          <button onClick={handleCreate} className="bg-green-600 text-white px-4 py-2 rounded">
            Create
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => (
          <div key={course._id} className="bg-white p-4 rounded shadow">
            <img src={course.images} alt={course.title} className="w-full h-32 object-cover mb-2" />
            <h3 className="font-semibold">{course.title}</h3>
            <p>{course.description}</p>
            <p>Hours: {course.hours}</p>
            <p>Difficulty: {course.difficulty}</p>
            <p>Mandatory: {course.mandatory ? 'Yes' : 'No'}</p>
            <button
              onClick={() => handleDelete(course._id)}
              className="bg-red-600 text-white px-2 py-1 rounded mt-2"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageCourses;
