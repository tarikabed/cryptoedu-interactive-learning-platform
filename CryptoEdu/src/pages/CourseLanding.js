import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { courses } from "../data/mockCourses";
import { supabase } from "../supabaseAPI";

const CourseLanding = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [courseProgress, setCourseProgress] = useState({
    progress: 0,
    lastLessonIndex: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const course = courses.find((c) => c.id === parseInt(id));
  
  // Calculate total lessons in this course
  const totalLessons = course?.sections.reduce((total, section) => total + section.lessons.length, 0) || 0;

  const fetchCourseProgress = useCallback(async () => {
    if (!course) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }
      
      // Get user's progress for this course
      const { data, error } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', parseInt(id))
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is fine
        console.error('Error fetching course progress:', error);
        setError('Failed to load course progress');
        setLoading(false);
        return;
      }
      
      if (data) {
        setCourseProgress({
          progress: data.progress_percentage || 0,
          lastLessonIndex: data.last_lesson_index || 0
        });
      }
    } catch (err) {
      console.error('Error in fetchCourseProgress:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [id, course]);

  useEffect(() => {
    fetchCourseProgress();
  }, [fetchCourseProgress]);

  if (!course) return <div style={{ color: "white" }}>Course not found</div>;

  // Function to get lesson number based on section and lesson indexes
  const getLessonNumber = (sectionIndex, lessonIndex) => {
    let absoluteIndex = 0;
    for (let i = 0; i < sectionIndex; i++) {
      absoluteIndex += course.sections[i].lessons.length;
    }
    return absoluteIndex + lessonIndex + 1;
  };

  // Determine which lessons are completed based on progress
  const isLessonCompleted = (lessonNumber) => {
    return ((lessonNumber / totalLessons) * 100) <= courseProgress.progress;
  };

  // Retry loading if there was an error
  const handleRetry = () => {
    fetchCourseProgress();
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      {/* Course Title */}
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem", color: "white" }}>{course.title}</h1>

      {/* Course Image */}
      {course.image && (
        <img
          src={course.image}
          alt={course.title}
          style={{ width: "100%", borderRadius: "0.75rem", maxHeight: "300px", objectFit: "cover", marginBottom: "1rem" }}
        />
      )}

      {/* Course Synopsis */}
      <p style={{ marginBottom: "1rem", fontSize: "1rem", color: "#cbd5e0" }}>{course.synopsis}</p>

      {loading ? (
        <div style={{ height: "8px", backgroundColor: "rgba(255, 255, 255, 0.1)", borderRadius: "4px", marginBottom: "1.5rem" }}>
          <div className="loading-bar" style={{ height: "100%", borderRadius: "4px" }}></div>
        </div>
      ) : error ? (
        <div style={{ 
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          padding: "1rem",
          borderRadius: "0.5rem",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span style={{ color: "#cbd5e0" }}>{error}</span>
          <button 
            onClick={handleRetry}
            style={{
              backgroundColor: "rgba(177, 254, 221, 0.2)",
              color: "#B1FEDD",
              padding: "0.25rem 0.5rem",
              border: "1px solid #B1FEDD",
              borderRadius: "0.25rem",
              cursor: "pointer",
              fontSize: "0.875rem"
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div style={{ 
            marginBottom: "1rem",
            background: "rgba(255, 255, 255, 0.1)",
            height: "8px",
            borderRadius: "4px",
            overflow: "hidden"
          }}>
            <div style={{
              width: `${courseProgress.progress}%`,
              height: "100%",
              backgroundColor: course.color,
              borderRadius: "4px",
              transition: "width 0.3s ease"
            }}></div>
          </div>
          
          {/* Progress percentage text */}
          <div style={{ 
            marginBottom: "1.5rem", 
            color: "#cbd5e0", 
            fontSize: "0.875rem",
            display: "flex",
            justifyContent: "space-between"
          }}>
            <span>{Math.round(courseProgress.progress)}% Complete</span>
            <span>{Math.round(courseProgress.progress * totalLessons / 100)}/{totalLessons} Lessons</span>
          </div>
        </>
      )}

      <button
        onClick={() => {
          // Navigate to first lesson or continue from last accessed
          if (courseProgress.lastLessonIndex > 0) {
            navigate(`/courses/${id}/lessons/${courseProgress.lastLessonIndex + 1}`);
          } else {
            navigate(`/courses/${id}/lessons/1`);
          }
        }}
        style={{ 
          backgroundColor: "#B1FEDD", 
          color: "#1a1a2e", 
          padding: "0.75rem 1.5rem", 
          border: "none", 
          borderRadius: "0.5rem", 
          cursor: "pointer", 
          fontWeight: "bold", 
          maxWidth: "200px" 
        }}
      >
        {courseProgress.progress > 0 ? "Continue Course" : "Start Course"}
      </button>

      {/* Course Outline */}
      <div style={{ marginTop: "2rem" }}>
        <h2 style={{ color: "white", marginBottom: "1rem" }}>Course Outline</h2>
        {course.sections.map((section, sectionIdx) => (
          <div 
            key={sectionIdx} 
            style={{
              marginBottom: "1.5rem",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: "0.75rem",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              overflow: "hidden"
            }}
          >
            <div style={{
              padding: "1rem",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              fontWeight: "bold",
              color: "white"
            }}>
              {section.title}
            </div>
            <ul style={{ 
              listStyle: "none", 
              padding: "0.5rem 0", 
              margin: 0 
            }}>
              {section.lessons.map((lesson, lessonIdx) => {
                const lessonNumber = getLessonNumber(sectionIdx, lessonIdx);
                const isCompleted = isLessonCompleted(lessonNumber);
                
                return (
                  <li
                    key={lessonIdx}
                    style={{
                      padding: "0.75rem 1.5rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      color: isCompleted ? "#4ade80" : "#cbd5e0",
                      backgroundColor: courseProgress.lastLessonIndex + 1 === lessonNumber ? 
                        "rgba(255, 255, 255, 0.05)" : "transparent"
                    }}
                    onClick={() => navigate(`/courses/${id}/lessons/${lessonNumber}`)}
                  >
                    {isCompleted ? (
                      <span style={{ 
                        marginRight: "0.75rem", 
                        color: "#4ade80", 
                        fontSize: "1rem" 
                      }}>✓</span>
                    ) : (
                      <span style={{ 
                        marginRight: "0.75rem", 
                        color: "#94a3b8",
                        fontSize: "0.75rem" 
                      }}>●</span>
                    )}
                    {lesson.title}
                    
                    {courseProgress.lastLessonIndex + 1 === lessonNumber && (
                      <span style={{
                        backgroundColor: course.color,
                        color: "#1a1a2e",
                        fontSize: "0.75rem",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "9999px",
                        marginLeft: "auto"
                      }}>
                        CURRENT
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* About Course */}
      {course.description && (
        <div style={{ 
          marginTop: "2rem",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          padding: "1.5rem",
          borderRadius: "1rem",
          border: "1px solid rgba(255, 255, 255, 0.1)"
        }}>
          <h2 style={{ color: "white", marginBottom: "1rem" }}>About this Course</h2>
          <p style={{ lineHeight: 1.6, color: "#cbd5e0" }}>{course.description}</p>
        </div>
      )}
    </div>
  );
};

export default CourseLanding;