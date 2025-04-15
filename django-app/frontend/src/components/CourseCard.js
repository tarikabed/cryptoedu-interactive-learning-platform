import { useNavigate } from "react-router-dom";


const CourseCard = ({ course }) => {
    const { id, title, icon: Icon, color } = course;
    const navigate = useNavigate();
  
    return (
      <div
        onClick={() => navigate(`/courses/${id}`)}
        style={{
          backgroundColor: color,
          borderRadius: "1rem",
          padding: "1.5rem",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          cursor: "pointer",
          transition: "all 0.2s ease-in-out"
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>
          {Icon && <Icon size={32} />}
        </div>
        <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>{title}</h3>
        <button style={{
          backgroundColor: "#000",
          color: "#fff",
          padding: "0.5rem 1rem",
          border: "none",
          borderRadius: "0.5rem",
          cursor: "pointer"
        }}>
          Start Course
        </button>
      </div>
    );
  };

export default CourseCard;