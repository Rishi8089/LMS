import React, { useState } from 'react';

const FileUploadQuiz = () => {
  const [file, setFile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!file) return alert("Please select a file first");

    setLoading(true);
    
    // 1. Create FormData object
    const formData = new FormData();
    formData.append('file', file);       // The .docx file
    formData.append('count', 5);         // Extra data
    formData.append('difficulty', 'Medium');

    try {
      // 2. Send to backend
      const res = await fetch('http://localhost:5000/api/generate-from-file', {
        method: 'POST',
        // IMPORTANT: Do NOT set Content-Type header manually when using FormData!
        // The browser sets it automatically with the "boundary"
        body: formData, 
      });

      const data = await res.json();
      if (data.success) {
        setQuestions(data.quizData);
      } else {
        alert("Failed: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Error uploading file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Upload Word Doc for Quiz</h2>
      
      <input 
        type="file" 
        accept=".docx" 
        onChange={(e) => setFile(e.target.files[0])} 
      />
      
      <button onClick={handleGenerate} disabled={loading} style={{ marginLeft: '10px' }}>
        {loading ? "Reading File & Generating..." : "Generate Quiz"}
      </button>

      {/* Render Questions Here (Same as before) */}
      <div style={{ marginTop: '20px' }}>
        {questions.length > 0 && <p>Generated {questions.length} questions!</p>}
      </div>
    </div>
  );
};

export default FileUploadQuiz;