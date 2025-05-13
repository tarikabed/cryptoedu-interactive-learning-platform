import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseAPI";
import { Trophy, DollarSign, Zap, BarChart2, Users, Globe, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Leaderboard = () => {
  const [sortOrder] = useState("desc");
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [friendsLeaderboardData, setFriendsLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFriendsOnly, setShowFriendsOnly] = useState(false);
  const navigate = useNavigate();

  const leaderboardColors = {
    profit: "#36D399",
    xp: "#FBBF24",
    streak: "#FB7185",
    trades: "#818CF8",
  };

  useEffect(() => {
    fetchLeaderboardData();
  }, []);
  const fetchLeaderboardData = async () => {
    setLoading(true);
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get all users with usernames
      const { data: userData, error: userError } = await supabase
        .from('user_usernames')
        .select('user_id, username');

      if (userError) throw userError;

      // Get all users' stats
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('user_id, total_profit, streak_count, total_xp, trades_count');

      if (statsError) throw statsError;

      // Combine username and stats data for global leaderboard
      const combinedData = statsData.map(stat => {
        const userInfo = userData.find(u => u.user_id === stat.user_id);
        return {
          user_id: stat.user_id,
          user: userInfo ? userInfo.username : "Anonymous",
          profit: stat.total_profit || 0,
          streak: stat.streak_count || 0,
          xp: stat.total_xp || 0,
          trades: stat.trades_count || 0,
        };
      });

      setLeaderboardData(combinedData);
      
      // Fetch friends list if user is logged in
      if (user) {
        // Get relationships where user is the sender
        const { data: sentFriendships } = await supabase
          .from('friends')
          .select('friend_id')
          .eq('user_id', user.id)
          .eq('status', 'accepted');
          
        // Get relationships where user is the receiver
        const { data: receivedFriendships } = await supabase
          .from('friends')
          .select('user_id')
          .eq('friend_id', user.id)
          .eq('status', 'accepted');
          
        // Combine both types of friendships
        const friendIds = [];
        
        if (sentFriendships && sentFriendships.length > 0) {
          friendIds.push(...sentFriendships.map(row => row.friend_id));
        }
        
        if (receivedFriendships && receivedFriendships.length > 0) {
          friendIds.push(...receivedFriendships.map(row => row.user_id));
        }
        
        // Add the current user to the friendIds
        friendIds.push(user.id);
        
        // Remove duplicates
        const uniqueFriendIds = [...new Set(friendIds)];
        
        // Filter the global leaderboard data for friends only
        const friendsData = combinedData.filter(item => uniqueFriendIds.includes(item.user_id));
        
        setFriendsLeaderboardData(friendsData);
      }
    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
    } finally {
      setLoading(false);
    }
  };
  const getSortedLeaderboard = (key) => {
    const dataToUse = showFriendsOnly ? friendsLeaderboardData : leaderboardData;
    return [...dataToUse].sort((a, b) => b[key] - a[key]);
  };
  
  const getLeaderboardIcon = (key) => {
    switch (key) {
      case 'profit': return DollarSign;
      case 'streak': return Zap;
      case 'xp': return Trophy;
      case 'trades': return BarChart2;
      default: return Trophy;
    }
  };
    const getLeaderboardTitle = (key) => {
    switch (key) {
      case 'profit': return 'Top Traders';
      case 'streak': return 'Longest Streaks';
      case 'xp': return 'Highest XP';
      case 'trades': return 'Most Trades Done';
      default: return key.charAt(0).toUpperCase() + key.slice(1);
    }
  };
  
  const toggleLeaderboardView = () => {
    setShowFriendsOnly(!showFriendsOnly);
  };
  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>        <h1 style={{ 
          fontSize: "2.5rem", 
          fontWeight: "700", 
          background: "linear-gradient(to right, #4ade80, #3b82f6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          display: 'flex', 
          alignItems: 'center',
          margin: 0
        }}>
          <Trophy size={28} color="#B1FEDD" style={{ marginRight: '0.75rem' }} />
          {showFriendsOnly ? "Friend Leaderboards" : "Global Leaderboards"}
        </h1>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          padding: '0.25rem',
          borderRadius: '2rem',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden'
        }}>
          <button 
            onClick={toggleLeaderboardView}
            style={{
              background: !showFriendsOnly ? 'rgba(177, 254, 221, 0.2)' : 'transparent',
              border: 'none',
              color: !showFriendsOnly ? '#B1FEDD' : '#94a3b8',
              padding: '0.5rem 1rem',
              borderRadius: '2rem',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            <Globe size={16} />
            Global
          </button>
          
          <button 
            onClick={toggleLeaderboardView}
            style={{
              background: showFriendsOnly ? 'rgba(177, 254, 221, 0.2)' : 'transparent',
              border: 'none',
              color: showFriendsOnly ? '#B1FEDD' : '#94a3b8',
              padding: '0.5rem 1rem',
              borderRadius: '2rem',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            <Users size={16} />
            Friends
          </button>
        </div>
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(4, 1fr)", 
        gap: "1.5rem", 
        marginTop: "1rem"
      }}>
        {["profit", "xp", "streak", "trades"].map((key) => {
          const sorted = getSortedLeaderboard(key);
          const color = leaderboardColors[key];
          const title = getLeaderboardTitle(key);
          const Icon = getLeaderboardIcon(key);
          
          return (
            <div
              key={key}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: "1rem",
                padding: "1.5rem",
                border: `2px solid ${color}`,
                boxShadow: `0 4px 12px rgba(0, 0, 0, 0.15)`,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '1.25rem',
                paddingBottom: '0.75rem'
              }}>
                <h3 style={{ 
                  color: 'white', 
                  fontSize: '1.4rem', 
                  fontWeight: 'bold',
                  margin: 0 
                }}>
                  {title}
                </h3>
                <Icon size={22} color={color} />
              </div>

              {loading ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem', 
                  color: '#94a3b8',
                  flex: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div className="loading-spinner" style={{ borderTopColor: color }}></div>
                </div>
              ) : sorted.length > 0 ? (
                <div style={{ flex: 1 }}>
                  {/* 1st Place - Champion */}
                  <div 
                    style={{
                      textAlign: "center", 
                      marginBottom: "1.5rem", 
                      backgroundColor: `${color}15`,
                      padding: "1.25rem", 
                      borderRadius: "0.75rem",
                      border: `1px solid ${color}30`
                    }}
                  >
                    <div style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>🏆</div>
                    <div style={{ fontWeight: "bold", fontSize: "1.1rem", color: color }}>{sorted[0]?.user || "—"}</div>
                    <div style={{ color: "#94a3b8", marginTop: "0.25rem" }}>
                      {key === 'profit' ? `$${sorted[0]?.[key].toLocaleString()}` : sorted[0]?.[key]}
                    </div>
                  </div>

                  <div style={{ 
                    overflowY: "auto", 
                    maxHeight: "350px",
                    scrollbarWidth: "thin", 
                    scrollbarColor: "#4b5563 transparent",
                    paddingRight: "0.5rem"
                  }}>
                    {/* 2nd and 3rd place */}
                    {[1, 2].map((index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex', 
                          justifyContent: 'space-between',
                          padding: '0.875rem 0.5rem',
                          borderRadius: '0.5rem',
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          marginBottom: '0.5rem',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            color: '#cbd5e0',
                            fontWeight: 'bold',
                            marginRight: '0.75rem',
                            fontSize: '0.9rem'
                          }}>
                            {index === 1 ? "🥈" : "🥉"}
                          </div>
                          <span style={{ 
                            color: '#cbd5e0', 
                            fontSize: '1rem'
                          }}>
                            {sorted[index]?.user || "—"}
                          </span>
                        </div>
                        <span style={{ 
                          color: '#94a3b8', 
                          fontSize: '1rem'
                        }}>
                          {key === 'profit' && sorted[index]?.[key] ? `$${sorted[index][key].toLocaleString()}` : sorted[index]?.[key]}
                        </span>
                      </div>
                    ))}

                    {/* 4th to 15th */}
                    {sorted.slice(3, 15).map((entry, idx) => (
                      <div
                        key={entry.user + idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '0.75rem 0.5rem',
                          borderBottom: idx < sorted.slice(3, 15).length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ 
                            width: '28px',
                            textAlign: 'center',
                            marginRight: '0.75rem',
                            color: '#94a3b8',
                            fontSize: '0.9rem'
                          }}>
                            {idx + 4}
                          </div>
                          <span style={{ color: '#cbd5e0' }}>{entry.user}</span>
                        </div>
                        <span style={{ color: '#94a3b8' }}>
                          {key === 'profit' ? `$${entry[key].toLocaleString()}` : entry[key]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem', 
                  color: '#94a3b8',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  {showFriendsOnly ? (
                    <>
                      <Users size={24} color="#94a3b8" />
                      <div>
                        <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>No friends data available</div>
                        <div style={{ fontSize: '0.9rem' }}>Add friends to see them on the leaderboard</div>
                      </div>
                      <button
                        onClick={() => navigate('/friends')}
                        style={{
                          background: 'transparent',
                          border: '1px solid #94a3b8',
                          color: '#94a3b8',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          marginTop: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <UserPlus size={14} /> Add Friends
                      </button>
                    </>
                  ) : (
                    <>
                      No data available
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}      </div>
      
      <style jsx="true">{`
        .loading-spinner {
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          border-top: 3px solid;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 1200px) {
          div[style*="gridTemplateColumns: repeat(4, 1fr)"] {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: repeat(4, 1fr)"] {
            grid-template-columns: repeat(1, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default Leaderboard;