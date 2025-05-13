import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseAPI";
import { Trophy } from "lucide-react";

const Navbar = () => {
  const [username, setUsername] = useState(null);
  const [userXp, setUserXp] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch username from user_usernames table
        const { data: usernameData } = await supabase
          .from('user_usernames')
          .select('username')
          .eq('user_id', user.id)
          .single();
        
        // Fetch user's XP and calculate level
        const { data: statsData } = await supabase
          .from('user_stats')
          .select('total_xp')
          .eq('user_id', user.id)
          .single();
          
        if (statsData) {
          const totalXp = statsData.total_xp || 0;
          setUserXp(totalXp);
          setUserLevel(Math.floor(totalXp / 200) + 1); // Level up every 200 XP
        }
        
        setUsername(usernameData?.username || user.email);
      }
    };

    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: usernameData } = await supabase
          .from('user_usernames')
          .select('username')
          .eq('user_id', session.user.id)
          .single();
          
        // Fetch user's XP and calculate level on auth state change
        const { data: statsData } = await supabase
          .from('user_stats')
          .select('total_xp')
          .eq('user_id', session.user.id)
          .single();
          
        if (statsData) {
          const totalXp = statsData.total_xp || 0;
          setUserXp(totalXp);
          setUserLevel(Math.floor(totalXp / 200) + 1); // Level up every 200 XP
        }
        
        setUsername(usernameData?.username || session.user.email);
      } else {
        setUsername(null);
        setUserXp(0);
        setUserLevel(1);
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUsername(null);
      navigate('/', { replace: true });
    }
  };
  const styles = {
    nav: {
      padding: "16px 32px",
      background: "linear-gradient(to right, #1a1a2e, #16213e)",
      color: "white",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: "2px solid rgba(177, 254, 221, 0.6)",
      boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
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
      fontWeight: 600,
      padding: "8px 16px",
      borderRadius: "8px",
      transition: "all 0.3s ease-in-out",
      position: "relative",
      letterSpacing: "0.5px",
    },
    activeLink: {
      background: "rgba(177, 254, 221, 0.15)",
      color: "#B1FEDD",
    },
    linkHover: {
      background: "rgba(177, 254, 221, 0.15)",
      color: "#B1FEDD",
      transform: "translateY(-2px)",
    },
    userInfo: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      fontSize: "15px",
      background: "rgba(177, 254, 221, 0.1)",
      padding: "8px 16px",
      borderRadius: "24px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
    },
    username: {
      fontWeight: "600",
      color: "#B1FEDD",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    userIcon: {
      background: "rgba(177, 254, 221, 0.2)",
      width: "28px",
      height: "28px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "14px",
    },
    logoutButton: {
      background: "transparent",
      color: "#ff6b6b",
      border: "1px solid #ff6b6b",
      padding: "6px 14px",
      borderRadius: "20px",
      cursor: "pointer",
      fontWeight: 600,
      transition: "all 0.2s ease-in-out",
    },
    logoutButtonHover: {
      background: "#ff6b6b",
      color: "white",
    },    logo: {
      fontWeight: "bold",
      fontSize: "20px",
      color: "#B1FEDD",
      marginRight: "24px",
      textDecoration: "none",
    },
    xpContainer: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginRight: "20px",
      background: "rgba(177, 254, 221, 0.08)",
      borderRadius: "20px",
      padding: "6px 12px",
      border: "1px solid rgba(177, 254, 221, 0.15)",
    },
    levelBadge: {
      background: "linear-gradient(135deg, #4ade80, #3b82f6)",
      color: "white",
      borderRadius: "50%",
      width: "28px",
      height: "28px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "14px",
      fontWeight: "bold",
      boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
    },    xpBarContainer: {
      flex: 1,
      height: "6px",
      background: "rgba(255, 255, 255, 0.1)",
      borderRadius: "3px",
      overflow: "hidden",
      minWidth: "140px",
    },
    xpBar: {
      height: "100%",
      background: "linear-gradient(90deg, #4ade80, #60a5fa)",
      borderRadius: "3px",
    },
    xpText: {
      fontSize: "10px",
      color: "#94a3b8",
      whiteSpace: "nowrap",
      marginLeft: "4px",
    },
  };
  const [hoveredLink, setHoveredLink] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(false);
    return (
    <nav style={styles.nav}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Link to="/home" style={styles.logo}>
          <img 
            src="/images/logo.png" 
            alt="CryptoEdu" 
            style={{ height: "30px" }}
          />
        </Link>
        <ul style={styles.ul}>
          <li>
            <Link 
              to="/home" 
              style={{ 
                ...styles.link, 
                ...(hoveredLink === 'home' ? styles.linkHover : {}) 
              }}
              onMouseEnter={() => setHoveredLink('home')}
              onMouseLeave={() => setHoveredLink(null)}
            >
              Home
            </Link>
          </li>
          <li>
            <Link 
              to="/trader" 
              style={{ 
                ...styles.link, 
                ...(hoveredLink === 'trader' ? styles.linkHover : {}) 
              }}
              onMouseEnter={() => setHoveredLink('trader')}
              onMouseLeave={() => setHoveredLink(null)}
            >
              Trading
            </Link>
          </li>
          <li>
            <Link 
              to="/courses" 
              style={{ 
                ...styles.link, 
                ...(hoveredLink === 'courses' ? styles.linkHover : {}) 
              }}
              onMouseEnter={() => setHoveredLink('courses')}
              onMouseLeave={() => setHoveredLink(null)}
            >
              Courses
            </Link>
          </li>
          <li>
            <Link 
              to="/quizzes" 
              style={{ 
                ...styles.link, 
                ...(hoveredLink === 'quizzes' ? styles.linkHover : {}) 
              }}
              onMouseEnter={() => setHoveredLink('quizzes')}
              onMouseLeave={() => setHoveredLink(null)}
            >
              Quizzes
            </Link>
          </li>
          <li>
            <Link 
              to="/achievements" 
              style={{ 
                ...styles.link, 
                ...(hoveredLink === 'achievements' ? styles.linkHover : {}) 
              }}
              onMouseEnter={() => setHoveredLink('achievements')}
              onMouseLeave={() => setHoveredLink(null)}
            >
              Achievements
            </Link>
          </li>
          <li>
            <Link 
              to="/profile" 
              style={{ 
                ...styles.link, 
                ...(hoveredLink === 'profile' ? styles.linkHover : {}) 
              }}
              onMouseEnter={() => setHoveredLink('profile')}
              onMouseLeave={() => setHoveredLink(null)}
            >
              Profile
            </Link>
          </li>
        </ul>
      </div>      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {username && (
          <div style={styles.xpContainer}>
            <div style={styles.levelBadge}>
              {userLevel}
            </div>
            <div>
              <div style={styles.xpBarContainer}>
                <div 
                  style={{
                    ...styles.xpBar,
                    width: `${(userXp % 200) / 200 * 100}%`
                  }}
                ></div>
              </div>
              <div style={styles.xpText}>
                {userXp % 200}/{200} XP
              </div>
            </div>
            <Trophy size={16} color="#B1FEDD" />
          </div>
        )}
        
        <div style={styles.userInfo}>
          {username ? (
            <>
              <div style={styles.username}>
                <div style={styles.userIcon}>
                  {username.charAt(0).toUpperCase()}
                </div>
                <span>{username}</span>
              </div>
              <button 
                onClick={handleLogout} 
                style={{
                  ...styles.logoutButton,
                  ...(hoveredButton ? styles.logoutButtonHover : {})
                }}
                onMouseEnter={() => setHoveredButton(true)}
                onMouseLeave={() => setHoveredButton(false)}
              >
                Logout
              </button>
            </>
          ) : (
            <Link 
              to="/login" 
              style={{ 
                ...styles.link,
                ...(hoveredLink === 'login' ? styles.linkHover : {}) 
              }}
              onMouseEnter={() => setHoveredLink('login')}
              onMouseLeave={() => setHoveredLink(null)}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
