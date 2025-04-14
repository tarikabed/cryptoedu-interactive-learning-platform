import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseAPI";

const Navbar = () => {
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email);
    };

    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || null);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
    window.location.href = "/";
  };

  const styles = {
    nav: {
      padding: "16px 32px",
      background: "#111827",
      color: "white",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: "3px solid #3b82f6",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
    },
    ul: {
      listStyle: "none",
      display: "flex",
      gap: "24px",
      margin: 0,
      padding: 0,
    },
    link: {
      color: "#ffffff",
      textDecoration: "none",
      fontWeight: 500,
      padding: "8px 12px",
      borderRadius: "8px",
      transition: "all 0.2s ease-in-out",
    },
    linkHover: {
      background: "#3b82f6",
      color: "#fff",
    },
    userInfo: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      fontSize: "14px",
    },
    logoutButton: {
      background: "#ef4444",
      color: "white",
      border: "none",
      padding: "6px 12px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: 500,
      transition: "background 0.2s ease-in-out",
    },
  };

  return (
    <nav style={styles.nav}>
      <ul style={styles.ul}>
        <li><Link to="/" style={styles.link}>Home</Link></li>
        <li><Link to="/trader" style={styles.link}>Trading</Link></li>
        <li><Link to="/portfolio" style={styles.link}>Portfolio</Link></li>
        <li><Link to="/courses" style={styles.link}>Courses</Link></li>
        <li><Link to="/friends" style={styles.link}>Friends</Link></li>
        <li><Link to="/achievements" style={styles.link}>Achievements</Link></li>
      </ul>
      <div style={styles.userInfo}>
        {userEmail ? (
          <>
            <span>Signed in as <strong>{userEmail}</strong></span>
            <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
          </>
        ) : (
          <Link to="/login" style={styles.link}>Login</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
