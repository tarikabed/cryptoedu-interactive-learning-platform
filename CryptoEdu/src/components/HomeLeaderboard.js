import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseAPI';
import { Trophy, DollarSign, Zap, BarChart2, Timer, Users, Globe, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HomeLeaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [friendsLeaderboardData, setFriendsLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFriendsOnly, setShowFriendsOnly] = useState(false);
  const navigate = useNavigate();

  const leaderboardColors = {
    profit: '#36D399',
    streak: '#FB7185',
    level: '#FBBF24',
    trades: '#818CF8',
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
          level: Math.floor((stat.total_xp || 0) / 200) + 1,
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
    return [...dataToUse].sort((a, b) => b[key] - a[key]).slice(0, 5);
  };

  const getLeaderboardIcon = (key) => {
    switch (key) {
      case 'profit': return DollarSign;
      case 'streak': return Zap;
      case 'level': return Trophy;
      case 'trades': return BarChart2;
      default: return Timer;
    }
  };
    const getLeaderboardTitle = (key) => {
    const prefix = showFriendsOnly ? 'Friend ' : '';
    
    switch (key) {
      case 'profit': return `${prefix}Top Traders`;
      case 'streak': return `${prefix}Longest Streaks`;
      case 'level': return `${prefix}Highest Levels`;
      case 'trades': return `${prefix}Most Trades Made`;
      default: return key.charAt(0).toUpperCase() + key.slice(1);
    }
  };

  const renderLeaderboard = (key) => {
    const sorted = getSortedLeaderboard(key);
    const color = leaderboardColors[key];
    const title = getLeaderboardTitle(key);
    const Icon = getLeaderboardIcon(key);
    
    return (
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '1rem',
        padding: '1.5rem',
        border: `2px solid ${color}`,
        boxShadow: `0 4px 12px rgba(0, 0, 0, 0.15)`,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
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
        ) : (
          <div style={{ flex: 1 }}>
            {sorted.length > 0 ? (
              sorted.map((entry, index) => (
                <div 
                  key={index}
                  style={{
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '0.875rem 0.5rem',
                    borderRadius: index === 0 ? '0.5rem' : '0',
                    backgroundColor: index === 0 ? `${color}15` : 'transparent',
                    borderBottom: index < sorted.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                    marginBottom: '0.25rem',
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
                      backgroundColor: index === 0 ? color : 'rgba(255, 255, 255, 0.08)',
                      color: index === 0 ? '#1a1a2e' : '#cbd5e0',
                      fontWeight: 'bold',
                      marginRight: '0.75rem',
                      fontSize: '0.875rem'
                    }}>
                      {index + 1}
                    </div>
                    <span style={{ 
                      color: index === 0 ? 'white' : '#cbd5e0', 
                      fontWeight: index === 0 ? 'bold' : 'normal',
                      fontSize: '1rem'
                    }}>
                      {entry.user}
                    </span>
                  </div>
                  <span style={{ 
                    color: index === 0 ? color : '#94a3b8', 
                    fontWeight: index === 0 ? 'bold' : 'normal',
                    fontSize: '1rem'
                  }}>
                    {key === 'profit' ? `$${entry[key].toLocaleString()}` : entry[key]}
                  </span>
                </div>
              ))
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
        )}
        
        <button
          onClick={() => navigate('/leaderboard')}
          style={{
            backgroundColor: `${color}15`,
            border: `1px solid ${color}40`,
            borderRadius: '0.5rem',
            color: color,
            cursor: 'pointer',
            fontSize: '0.9rem',
            padding: '0.75rem',
            textAlign: 'center',
            width: '100%',
            marginTop: 'auto',
            fontWeight: 'bold',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = `${color}25`;
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = `${color}15`;
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          View Full Leaderboard →
        </button>
      </div>
    );
  };
  // Toggle between global and friends leaderboard
  const toggleLeaderboardView = () => {
    setShowFriendsOnly(!showFriendsOnly);
  };

  return (
    <div style={{ marginTop: '2.5rem' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h2 style={{ 
          fontSize: '1.75rem', 
          color: 'white', 
          display: 'flex', 
          alignItems: 'center',
          margin: 0
        }}>
          <Trophy size={24} color="#B1FEDD" style={{ marginRight: '0.75rem' }} />
          Leaderboards
        </h2>
        
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
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '2rem',
        marginBottom: '2.5rem'
      }}>
        {renderLeaderboard('profit')}
        {renderLeaderboard('streak')}
        {renderLeaderboard('level')}
      </div>
    </div>
  );
};

export default HomeLeaderboard;