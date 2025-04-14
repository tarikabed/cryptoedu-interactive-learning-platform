import React from "react";
import CourseCard from "../components/CourseCard";

const mockCourses = [
  {
    id: 1,
    title: "Intro to Trading",
    emoji: "📘",
    color: "#FEE2E2",
  },
  {
    id: 2,
    title: "Risk Management",
    emoji: "🧠",
    color: "#E0F2FE",
  },
  {
    id: 3,
    title: "Advanced Strategies",
    emoji: "🚀",
    color: "#E9D5FF",
  },
];

const Courses = () => {
  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Courses</h1>
      <p style={{ marginBottom: "1.5rem", color: "#555" }}>Choose a path to level up your trading skills 🧠</p>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
        gap: "1.5rem"
      }}>
        {mockCourses.map(course => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
};

export default Courses;
