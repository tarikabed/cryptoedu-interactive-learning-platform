import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CourseCard from "../components/CourseCard";
import { courses } from "../data/mockCourses";
import { supabase } from "../supabaseAPI";
import { AlertTriangle, Book } from 'lucide-react';

const Courses = () => {
  const [userProgress, setUserProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProgress();
  }, []);

  const fetchUserProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }
      
      // Get user's course progress
      const { data: progressData, error } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching course progress:', error);
        setError('Failed to load your course progress. Please refresh the page.');
        setLoading(false);
        return;
      }
      
      // Transform the data into a more usable format
      const progressMap = {};
      progressData?.forEach(item => {
        progressMap[item.course_id] = {
          progress: item.progress_percentage || 0,
          lastLessonIndex: item.last_lesson_index || 0
        };
      });
      
      setUserProgress(progressMap);
    } catch (err) {
      console.error('Error in fetchUserProgress:', err);
      setError('An unexpected error occurred. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // Retry loading if there was an error
  const handleRetry = () => {
    fetchUserProgress();
  };
  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header section with title */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ 
          fontSize: "2.5rem", 
          fontWeight: "700", 
          background: "linear-gradient(to right, #4ade80, #3b82f6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          margin: "0 0 0.5rem 0"
        }}>
          Cryptocurrency Courses
        </h1>
        <p style={{ 
          color: "#94a3b8", 
          fontSize: "1.1rem",
          maxWidth: "600px",
          margin: 0,
          lineHeight: "1.6"
        }}>
          Choose a path to level up your trading skills and cryptocurrency knowledge
        </p>
      </div>      {loading ? (
        <div style={{ 
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "calc(100vh - 300px)",
          color: "white"
        }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: "3px solid rgba(59, 130, 246, 0.3)",
            borderTop: "3px solid #3b82f6",
            borderRadius: "50%",
            marginBottom: "1rem",
            animation: "spin 1s linear infinite",
          }}></div>
          <h2>Loading courses...</h2>
          <style>{`
              @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
              }
          `}</style>
        </div>
      ) : error ? (
        <div style={{
          background: "linear-gradient(to right, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))",
          borderRadius: "16px",
          padding: "1.5rem",
          textAlign: "center",
          color: "#fff",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          marginBottom: "2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem"
        }}>
          <div style={{
            background: "rgba(239, 68, 68, 0.2)",
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "0.5rem"
          }}>
            <AlertTriangle size={28} color="#ef4444" />
          </div>
          <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>{error}</p>
          <button 
            onClick={handleRetry}
            style={{
              background: "rgba(239, 68, 68, 0.8)",
              color: "white",
              padding: "0.75rem 1.5rem",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "all 0.2s ease"
            }}
          >
            Try Again
          </button>
        </div>      ) : (
        <>
          {/* Information banner */}
          <div style={{
            background: "linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(74, 222, 128, 0.1))",
            borderRadius: "16px",
            padding: "1.5rem",
            marginBottom: "2rem",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div>
              <h2 style={{ 
                color: "white", 
                fontSize: "1.3rem",
                fontWeight: "600",
                margin: "0 0 0.5rem 0",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>                <Book size={20} color="#3b82f6" /> Expand Your Crypto Knowledge
              </h2>
              <p style={{ color: "#94a3b8", margin: "0 0 0.75rem 0" }}>
                Each course is designed to build your understanding from beginner to advanced levels
              </p>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <div style={{
                  padding: "0.35rem 0.75rem",
                  backgroundColor: "rgba(177, 254, 221, 0.1)",
                  color: "#B1FEDD",
                  borderRadius: "0.5rem",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  border: "1px solid rgba(177, 254, 221, 0.2)",
                }}>
                  <span style={{ fontSize: "0.9rem" }}>✨</span>
                  Earn 400 XP per course
                </div>
                <div style={{
                  padding: "0.35rem 0.75rem",
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                  color: "#60a5fa",
                  borderRadius: "0.5rem",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                }}>
                  <span style={{ fontSize: "0.9rem" }}>💰</span>
                  Earn $25,000 per course
                </div>
              </div>
            </div>
          </div>
          
          <h2 style={{ 
            color: "white", 
            fontSize: "1.4rem", 
            marginBottom: "1.5rem",
            fontWeight: "600"
          }}>
            Available Courses
          </h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {courses.map((course) => (
              <CourseCard 
                key={course.id} 
                course={course} 
                progress={userProgress[course.id]?.progress || 0}
                lastLessonIndex={userProgress[course.id]?.lastLessonIndex || 0}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Courses;
