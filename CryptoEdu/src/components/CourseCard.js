import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CourseCard = ({ course, progress = 0, lastLessonIndex = 0 }) => {
  const { id, title, image, synopsis, sections, color } = course;
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Calculate total lessons in this course
  const totalLessons = sections.reduce((total, section) => total + section.lessons.length, 0);

  return (
    <div
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: "1rem",
        padding: "1.5rem",
        marginBottom: "2rem",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        transition: "all 0.2s ease-in-out",
        border: `1px solid ${color}`,
        position: "relative"
      }}
    >
      {image && (
        <img
          src={image}
          alt={title}
          style={{ width: "100%", borderRadius: "0.75rem", marginBottom: "1rem" }}
        />
      )}
      <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", color: "white" }}>{title}</h2>      <p style={{ marginBottom: "1rem", fontSize: "1rem", color: "#cbd5e0" }}>{synopsis}</p>
      
      {/* Rewards */}
      <div style={{ 
        display: "flex", 
        gap: "1rem", 
        marginBottom: "1rem",
        alignItems: "center" 
      }}>
        <div style={{
          padding: "0.35rem 0.75rem",
          backgroundColor: "rgba(177, 254, 221, 0.1)",
          color: "#B1FEDD",
          borderRadius: "0.5rem",
          fontSize: "0.875rem",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          border: "1px solid rgba(177, 254, 221, 0.2)",
        }}>
          <span style={{ fontSize: "1rem" }}>✨</span>
          Reward: 400 XP
        </div>
        <div style={{
          padding: "0.35rem 0.75rem",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          color: "#60a5fa",
          borderRadius: "0.5rem",
          fontSize: "0.875rem",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          border: "1px solid rgba(59, 130, 246, 0.2)",
        }}>
          <span style={{ fontSize: "1rem" }}>💰</span>
          Reward: $25,000
        </div>
      </div>
      
      {/* Progress bar */}
      <div style={{ 
        marginBottom: "1rem",
        background: "rgba(255, 255, 255, 0.1)",
        height: "6px",
        borderRadius: "3px",
        overflow: "hidden"
      }}>
        <div style={{
          width: `${progress}%`,
          height: "100%",
          backgroundColor: color,
          borderRadius: "3px",
          transition: "width 0.3s ease"
        }}></div>
      </div>
      
      {/* Progress percentage text */}
      <div style={{ 
        marginBottom: "1rem", 
        color: "#cbd5e0", 
        fontSize: "0.875rem",
        display: "flex",
        justifyContent: "space-between"
      }}>
        <span>{Math.round(progress)}% Complete</span>
        <span>{Math.round(progress * totalLessons / 100)}/{totalLessons} Lessons</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            border: "1px solid #B1FEDD",
            backgroundColor: "transparent",
            color: "#B1FEDD",
            cursor: "pointer"
          }}
        >
          {isExpanded ? "Hide Contents" : "Show Contents"}
        </button>

        <button
          onClick={() => {
            // Navigate to the course landing page or directly to the last accessed lesson if available
            if (lastLessonIndex > 0) {
              navigate(`/courses/${id}/lessons/${lastLessonIndex + 1}`);
            } else {
              navigate(`/courses/${id}`);
            }
          }}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            backgroundColor: "#B1FEDD",
            color: "#1a1a2e",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          {progress > 0 ? "Continue Course" : "Start Course"}
        </button>
      </div>

      {isExpanded && (
        <div style={{ marginTop: "1rem", color: "#cbd5e0" }}>
          {sections?.map((section, sectionIdx) => (
            <div key={sectionIdx} style={{ marginBottom: "1rem" }}>
              <h4 style={{ fontWeight: "bold", color: "white" }}>{section.title}</h4>
              <ul style={{ paddingLeft: "1rem" }}>
                {section.lessons.map((lesson, lessonIdx) => {
                  // Calculate the absolute lesson index across all sections
                  let absoluteLessonIndex = 0;
                  for (let i = 0; i < sectionIdx; i++) {
                    absoluteLessonIndex += sections[i].lessons.length;
                  }
                  absoluteLessonIndex += lessonIdx;
                  
                  // Determine if this lesson has been completed based on progress
                  const lessonNumber = absoluteLessonIndex + 1;
                  const isCompleted = ((lessonNumber / totalLessons) * 100) <= progress;
                  
                  return (
                    <li 
                      key={lessonIdx} 
                      style={{ 
                        marginBottom: "0.25rem",
                        display: "flex",
                        alignItems: "center",
                        color: isCompleted ? "#4ade80" : "#cbd5e0",
                        cursor: "pointer"
                      }}
                      onClick={() => navigate(`/courses/${id}/lessons/${absoluteLessonIndex + 1}`)}
                    >
                      {isCompleted && (
                        <span style={{ marginRight: "0.5rem", fontSize: "0.75rem" }}>✓</span>
                      )}
                      {lesson.title}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseCard;
