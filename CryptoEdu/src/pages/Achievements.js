import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseAPI";
import { Shield } from "lucide-react";

const Achievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const fetchAchievements = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return;
      }

      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*');
      
      if (achievementsError) {
        return;
      }
      
      const { data: stats } = await supabase
        .from('user_stats')
        .select('streak_count, total_profit, trades_count, total_xp')
        .eq('user_id', user.id)
        .single();
        
      const userStatsData = stats || {
        streak_count: 0,
        total_profit: 0,
        trades_count: 0,
        total_xp: 0
      };
      
      const { data: courseProgress } = await supabase
        .from('user_course_progress')
        .select('course_id, progress_percentage')
        .eq('user_id', user.id);
        
      const completedCourses = courseProgress ? 
        courseProgress.filter(course => course.progress_percentage >= 100).length : 0;
      
      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id);
      
      if (userAchievementsError) {
        return;
      }
      
      const unlockedMap = {};
      userAchievements?.forEach(ua => {
        unlockedMap[ua.achievement_id] = {
          unlocked: true,
          unlocked_at: new Date(ua.unlocked_at).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          }),
          unlocked_relative: getRelativeTimeString(new Date(ua.unlocked_at))
        };
      });
      
      const combinedAchievements = allAchievements?.map(ach => {
        // If the achievement is already unlocked, set progress to 100%
        if (unlockedMap[ach.id]) {
          return {
            ...ach,
            ...unlockedMap[ach.id],
            progress: 100,
            currentValue: ach.requirement_value
          };
        }
        
        let progress = 0;
        let currentValue = 0;
        let targetValue = ach.requirement_value || 1;
        
        switch(ach.requirement_type) {
          case 'trade_count':
            currentValue = Math.min(userStatsData.trades_count, targetValue);
            progress = (currentValue / targetValue) * 100;
            break;
          case 'streak_count':
            currentValue = Math.min(userStatsData.streak_count, targetValue);
            progress = (currentValue / targetValue) * 100;
            break;
          case 'profit':
            currentValue = Math.min(userStatsData.total_profit, targetValue);
            progress = (currentValue / targetValue) * 100;
            break;
          case 'xp':
            currentValue = Math.min(userStatsData.total_xp, targetValue);
            progress = (currentValue / targetValue) * 100;
            break;
          case 'courses_completed':
            currentValue = Math.min(completedCourses, targetValue);
            progress = (currentValue / targetValue) * 100;
            break;
          default:
            progress = 0;
        }
        
        return {
          ...ach,
          ...unlockedMap[ach.id],
          progress: Math.min(100, Math.round(progress)),
          currentValue
        };
      });
      
      setAchievements(combinedAchievements || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const getRelativeTimeString = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} ${Math.floor(diffDays / 7) === 1 ? 'week' : 'weeks'} ago`;
    return `${Math.floor(diffDays / 30)} ${Math.floor(diffDays / 30) === 1 ? 'month' : 'months'} ago`;
  };

  const renderAchievement = (ach) => {
    const isUnlocked = !!ach.unlocked || ach.progress >= 100;
    
    return (
      <div
        key={ach.id}
        style={{
          display: 'flex',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '1rem',
          padding: '1.25rem',
          alignItems: 'center',
          opacity: isUnlocked ? 1 : 0.85,
          border: isUnlocked ? '1px solid rgba(74, 222, 128, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: isUnlocked ? '0 4px 15px rgba(74, 222, 128, 0.15)' : 'none',
          position: 'relative',
          overflow: 'hidden',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          marginBottom: '0.75rem',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = isUnlocked 
            ? '0 8px 25px rgba(74, 222, 128, 0.2)' 
            : '0 8px 20px rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = isUnlocked 
            ? '0 4px 15px rgba(74, 222, 128, 0.15)' 
            : 'none';
        }}
      >
        {/* Background gradient accent for completed achievements */}
        {isUnlocked && (
          <div style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "150px",
            height: "150px",
            borderRadius: "0 0 0 150px",
            background: "linear-gradient(135deg, rgba(74, 222, 128, 0.2), rgba(16, 185, 129, 0.05))",
            opacity: 0.5,
            zIndex: 0
          }} />
        )}
        
        {/* Achievement icon */}
        <div style={{ 
          fontSize: "2rem", 
          marginRight: "1.25rem",
          width: "64px",
          height: "64px",
          borderRadius: "16px",
          backgroundColor: isUnlocked 
            ? 'rgba(74, 222, 128, 0.15)'
            : 'rgba(255, 255, 255, 0.05)',
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: isUnlocked ? "#4ade80" : "#94a3b8",
          position: "relative",
          boxShadow: isUnlocked 
            ? '0 4px 12px rgba(74, 222, 128, 0.2)'
            : 'none',
          zIndex: 1
        }}>
          {ach.badge_icon}
        </div>

        {/* Achievement info */}
        <div style={{ flexGrow: 1, position: 'relative', zIndex: 1 }}>
          <div style={{ 
            fontSize: "1.1rem", 
            fontWeight: "600", 
            color: isUnlocked 
              ? "#4ade80" 
              : "white",
            display: "flex", 
            alignItems: "center", 
            gap: "0.75rem",
            marginBottom: "0.375rem"
          }}>
            {ach.name}
            {isUnlocked && (
              <span style={{ 
                background: "linear-gradient(90deg, #4ade80, #10b981)",
                color: "#111", 
                fontSize: "0.7rem", 
                padding: "0.2rem 0.5rem", 
                borderRadius: "9999px",
                fontWeight: "600",
                boxShadow: '0 2px 8px rgba(74, 222, 128, 0.3)'
              }}>
                COMPLETED
              </span>
            )}
          </div>          <div style={{ 
            fontSize: "0.95rem", 
            color: isUnlocked ? '#94a3b8' : '#888',
            lineHeight: '1.4'
          }}>
            {ach.description}
          </div>
          
          {/* Rewards */}
          <div style={{ 
            display: "flex", 
            gap: "0.75rem", 
            marginTop: "0.6rem",
            alignItems: "center" 
          }}>
            <div style={{
              padding: "0.25rem 0.6rem",
              backgroundColor: "rgba(177, 254, 221, 0.1)",
              color: "#B1FEDD",
              borderRadius: "0.5rem",
              fontSize: "0.8rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              border: "1px solid rgba(177, 254, 221, 0.2)",
            }}>
              <span style={{ fontSize: "0.9rem" }}>✨</span>
              400 XP
            </div>
            <div style={{
              padding: "0.25rem 0.6rem",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              color: "#60a5fa",
              borderRadius: "0.5rem",
              fontSize: "0.8rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              border: "1px solid rgba(59, 130, 246, 0.2)",
            }}>
              <span style={{ fontSize: "0.9rem" }}>💰</span>
              ${ach.id % 2 === 0 ? "40,000" : "25,000"}
            </div>
          </div>
          
          {/* Progress bar for non-completed achievements */}
          {!isUnlocked && (
            <>
              <div style={{ 
                marginTop: '0.75rem',
                height: '6px',
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${ach.progress}%`,
                  background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                  borderRadius: '3px'
                }}></div>
              </div>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem', 
                color: '#94a3b8', 
                marginTop: '0.375rem' 
              }}>
                <div>
                  {ach.requirement_type === 'trade_count' && `${ach.currentValue}/${ach.requirement_value} trades`}
                  {ach.requirement_type === 'streak_count' && `${ach.currentValue}/${ach.requirement_value} days`}
                  {ach.requirement_type === 'profit' && `£${ach.currentValue.toLocaleString()}/${ach.requirement_value.toLocaleString()} profit`}
                  {ach.requirement_type === 'xp' && `${ach.currentValue}/${ach.requirement_value} XP`}
                  {ach.requirement_type === 'courses_completed' && `${ach.currentValue}/${ach.requirement_value} courses`}
                </div>
                <div>{ach.progress}% complete</div>
              </div>
            </>
          )}
        </div>

        {/* Status indicator */}
        {isUnlocked && (
          <div style={{ 
            marginLeft: '1rem',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              color: "#10b981",
              fontWeight: "bold",
              background: "linear-gradient(90deg, rgba(74, 222, 128, 0.15), rgba(16, 185, 129, 0.25))",
              borderRadius: "9999px",
              padding: "0.4rem 0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Complete!
            </div>
          </div>
        )}
        {!isUnlocked && (
          <div style={{ 
            marginLeft: '1rem',
            position: 'relative',
            zIndex: 1,
            minWidth: '60px',
            textAlign: 'right'
          }}>
            <div style={{
              color: "#94a3b8",
              fontWeight: "bold",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "9999px",
              padding: "0.4rem 0.75rem",
              display: "inline-block"
            }}>
              {ach.progress}%
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "2rem",
      }}>
        <div>
          <h1 style={{ 
            fontSize: "2.5rem", 
            fontWeight: "700", 
            background: "linear-gradient(to right, #4ade80, #3b82f6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: "0 0 0.5rem 0"
          }}>
            Your Achievements
          </h1>
          <p style={{ 
            color: "#94a3b8", 
            fontSize: "1.1rem",
            maxWidth: "600px",
            margin: 0
          }}>
            Track your progress and milestones as you learn about cryptocurrency.
          </p>
        </div>
      </div>

      <div style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: '2rem',
        borderRadius: '1rem',
        marginBottom: '2rem',
        color: 'white',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background gradient accent */}
        <div style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "200px",
          height: "200px",
          borderRadius: "0 0 0 100%",
          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(74, 222, 128, 0.15))",
          opacity: 0.5,
          zIndex: 0
        }} />
        
        <div style={{ 
          width: "70px", 
          height: "70px", 
          borderRadius: "16px", 
          background: "rgba(74, 222, 128, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginRight: "1.5rem",
          position: "relative",
          zIndex: 1,
          boxShadow: "0 4px 12px rgba(74, 222, 128, 0.15)",
          float: "left"
        }}>
          <Shield size={32} color="#4ade80" />
        </div>
        <div style={{ 
          marginLeft: "100px", 
          position: "relative", 
          zIndex: 1
        }}>
          <h2 style={{ 
            fontSize: "1.4rem", 
            fontWeight: "600", 
            color: "#fff", 
            marginBottom: "0.75rem",
            display: "flex",
            alignItems: "center"
          }}>
            Achievement Progress
          </h2>          <div style={{ color: "#e2e8f0", fontSize: "1.1rem", marginBottom: "1rem" }}>
            You've unlocked <span style={{ fontWeight: "600", color: "#4ade80" }}>{achievements.filter(a => a.unlocked || a.progress >= 100).length}</span> out of <span style={{ fontWeight: "600" }}>{achievements.length}</span> total achievements
          </div>
          
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{
              padding: "0.35rem 0.75rem",
              backgroundColor: "rgba(177, 254, 221, 0.1)",
              color: "#B1FEDD",
              borderRadius: "0.5rem",
              fontSize: "0.85rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              border: "1px solid rgba(177, 254, 221, 0.2)",
            }}>
              <span style={{ fontSize: "0.9rem" }}>✨</span>
              Earn 400 XP per achievement
            </div>
            <div style={{
              padding: "0.35rem 0.75rem",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              color: "#60a5fa",
              borderRadius: "0.5rem",
              fontSize: "0.85rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              border: "1px solid rgba(59, 130, 246, 0.2)",
            }}>
              <span style={{ fontSize: "0.9rem" }}>💰</span>
              Earn $25,000-$40,000 per achievement
            </div>
          </div>
          <div style={{ 
            width: "100%", 
            height: "10px", 
            backgroundColor: "rgba(255, 255, 255, 0.1)", 
            borderRadius: "5px",
            position: "relative",
            overflow: "hidden"
          }}>
            <div style={{ 
              position: "absolute", 
              left: 0, 
              top: 0, 
              height: "100%", 
              width: `${achievements.length ? (achievements.filter(a => a.unlocked || a.progress >= 100).length / achievements.length) * 100 : 0}%`,
              background: "linear-gradient(90deg, #4ade80, #3b82f6)",
              borderRadius: "5px"
            }} />
          </div>
        </div>
        <div style={{ clear: "both" }}></div>
      </div>

      {loading && (
        <div style={{ 
          textAlign: "center", 
          color: "#94a3b8", 
          padding: "3rem",
          backgroundColor: "rgba(255, 255, 255, 0.02)",
          borderRadius: "1rem",
          marginBottom: "2rem"
        }}>
          Loading achievements...
        </div>
      )}

      {!loading && achievements.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {achievements.map(renderAchievement)}
        </div>
      )}
    </div>
  );
};

export default Achievements;

