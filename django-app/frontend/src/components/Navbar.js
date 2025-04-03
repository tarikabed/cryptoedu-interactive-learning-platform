import { Link } from "react-router-dom";

const Navbar = () => {
    return (
        <nav style={{ padding: "3px", background: "#333", color: "white" }}>
            <ul style={{ listStyle: "none", display: "flex", gap: "20px" }}>
                <li><Link to="/" style={{ color: "white", textDecoration: "none" }}>Home</Link></li>
                <li><Link to="/trader" style={{ color: "white", textDecoration: "none" }}>Trader</Link></li>
                <li><Link to="/quizzes" style={{ color: "white", textDecoration: "none" }}>Quizzes</Link></li>
                <li><Link to="/learn" style={{ color: "white", textDecoration: "none" }}>Learn</Link></li>
                <li><Link to="/news" style={{ color: "white", textDecoration: "none" }}>News</Link></li>
            </ul>
        </nav>
    );
};

export default Navbar;
