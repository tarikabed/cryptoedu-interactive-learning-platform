import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { courses } from "../data/mockCourses";
import { supabase } from "../supabaseAPI";

export default function CourseDetail() {
  const { id } = useParams();
  const course = courses.find((c) => c.id === parseInt(id));
  const [completedLessons, setCompletedLessons] = useState([]);

  useEffect(() => {
    const fetchProgress = async () => {
      const token = (await supabase.auth.getSession()).data.session?.access_token;

      const res = await fetch("http://localhost:8000/api/progress/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      const completed = data
        .filter(p => p.course_id === parseInt(id) && p.completed)
        .map(p => p.lesson_id);

      setCompletedLessons(completed);
    };

    fetchProgress();
  }, [id]);

  const markComplete = async (lessonId) => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;

    await fetch("http://localhost:8000/api/progress/complete/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        course_id: course.id,
        lesson_id: lessonId,
      }),
    });

    setCompletedLessons([...completedLessons, lessonId]);
  };

  const total = course.lessons.length;
  const done = completedLessons.length;
  const progress = Math.round((done / total) * 100);

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{course.title}</h1>
      <p style={{ color: "#555", marginBottom: "1rem" }}>
        {progress}% complete
      </p>

      <div style={{
        height: "12px",
        background: "#eee",
        borderRadius: "10px",
        overflow: "hidden",
        marginBottom: "2rem"
      }}>
        <div style={{
          width: `${progress}%`,
          background: "#4ade80",
          height: "100%",
          transition: "width 0.3s ease-in-out"
        }} />
      </div>

      {course.lessons.map((lesson) => (
        <div
          key={lesson.id}
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            background: "#f9f9f9",
            borderRadius: "0.5rem",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.05)"
          }}
        >
          <span style={{ marginRight: "12px", fontSize: "1.25rem" }}>
            {completedLessons.includes(lesson.id) ? "✅" : "🔘"}
          </span>
          <span style={{ flex: 1 }}>{lesson.title}</span>

          {!completedLessons.includes(lesson.id) && (
            <button
              onClick={() => markComplete(lesson.id)}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                background: "#3b82f6",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: "0.9rem"
              }}
            >
              Mark as Complete
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
