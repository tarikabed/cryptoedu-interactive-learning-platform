import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseAPI';
import { BookOpen, Zap, Trophy, Gift } from 'lucide-react';
import HomeLeaderboard from '../components/HomeLeaderboard';

export default function Home() {  const [userStats, setUserStats] = useState({
    completedCourses: 0,
    totalCourses: 3, // We have 3 mock courses by default
    streak: 0,
    level: 1,
    badges: 0,
    progress: 0,
    name: '',
    totalAchievements: 30,
    courseProgress: 0,
    quizProgress: 0,
    achievementProgress: 0
  });

  useEffect(() => {
    fetchUserData();
    updateLoginStreak();
  }, []);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: stats, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user stats:', error);
      return;
    }

    // Fetch username from user_usernames table
    const { data: usernameData } = await supabase
      .from('user_usernames')
      .select('username')
      .eq('user_id', user.id)
      .single();
      if (stats) {
      setUserStats(prev => ({
        ...prev,
        streak: stats.streak_count || 0,
        level: Math.floor(stats.total_xp / 200) + 1, // Level up every 200 XP
        name: usernameData?.username || user.email.split('@')[0]
      }));
    }
    
    // -------------- COURSES PROGRESS --------------
    const { data: courseProgress } = await supabase
      .from('user_course_progress')
      .select('course_id, progress_percentage')
      .eq('user_id', user.id);
    
    // Calculate average course progress
    let avgCourseProgress = 0;
    let coursesCount = 3; // Default number of courses
    
    if (courseProgress && courseProgress.length > 0) {
      // Sum up all the course progress percentages
      const totalProgress = courseProgress.reduce((sum, course) => sum + (course.progress_percentage || 0), 0);
      avgCourseProgress = totalProgress / coursesCount;
      
      // Count completed courses
      const completedCourses = courseProgress.filter(course => course.progress_percentage >= 100).length;
      
      setUserStats(prev => ({
        ...prev,
        completedCourses: completedCourses,
        courseProgress: Math.round(avgCourseProgress)
      }));
    }
    
    // -------------- QUIZZES PROGRESS --------------
    // Get all quiz topics
    const { data: quizTopics } = await supabase
      .from('quiz_topics')
      .select(`*, quiz_questions(count)`);
    
    // Get user's quiz progress
    const { data: quizProgress } = await supabase
      .from('user_quiz_progress')
      .select('topic_id, is_correct')
      .eq('user_id', user.id);
    
    let avgQuizProgress = 0;
    
    if (quizTopics && quizProgress) {
      // Calculate progress for each quiz topic
      const progressByTopic = quizProgress.reduce((acc, curr) => {
        if (!acc[curr.topic_id]) {
          acc[curr.topic_id] = { completed: 0, correct: 0 };
        }
        acc[curr.topic_id].completed++;
        if (curr.is_correct) {
          acc[curr.topic_id].correct++;
        }
        return acc;
      }, {});
      
      // Calculate total quiz progress
      if (quizTopics.length > 0) {
        let totalQuizProgress = 0;
        
        quizTopics.forEach(topic => {
          const questionsCount = topic.quiz_questions[0].count;
          const topicProgress = progressByTopic[topic.id];
          const progressPercentage = topicProgress ? 
            Math.round((topicProgress.completed / questionsCount) * 100) : 0;
          
          totalQuizProgress += progressPercentage;
        });
        
        avgQuizProgress = totalQuizProgress / quizTopics.length;
      }
      
      setUserStats(prev => ({
        ...prev,
        quizProgress: Math.round(avgQuizProgress)
      }));
    }
    
    // -------------- ACHIEVEMENTS PROGRESS --------------
    // Get total achievements from the database
    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('count')
      .single();
      
    // Get user's unlocked achievements
    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user.id);

    let achievementProgress = 0;
    
    if (allAchievements && userAchievements) {
      const totalAchievements = allAchievements.count || 30; // Fallback to 30 if count not available
      achievementProgress = (userAchievements.length / totalAchievements) * 100;
      
      setUserStats(prev => ({
        ...prev,
        badges: userAchievements.length,
        totalAchievements: totalAchievements,
        achievementProgress: Math.round(achievementProgress)
      }));
    }
    
    // -------------- OVERALL PROGRESS CALCULATION --------------
    // Calculate weighted average of all progress types
    // 40% courses, 30% quizzes, 30% achievements
    const overallProgress = Math.round(
      (avgCourseProgress * 0.4) + 
      (avgQuizProgress * 0.3) + 
      (achievementProgress * 0.3)
    );
    
    setUserStats(prev => ({
      ...prev,
      progress: overallProgress
    }));
  };

  const updateLoginStreak = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    
    const { data: lastLogin } = await supabase
      .from('user_stats')
      .select('last_login_date, streak_count')
      .eq('user_id', user.id)
      .single();

    if (lastLogin) {
      const lastLoginDate = new Date(lastLogin.last_login_date).toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      let newStreak = lastLogin.streak_count;
      
      if (lastLoginDate === yesterday) {
        newStreak += 1;
      } else if (lastLoginDate !== today) {
        newStreak = 1;
      }

      await supabase
        .from('user_stats')
        .update({ 
          last_login_date: today,
          streak_count: newStreak
        })
        .eq('user_id', user.id);

      setUserStats(prev => ({
        ...prev,
        streak: newStreak
      }));
    }
  };
  
  const StatCard = ({ icon: Icon, title, value, color, gradient, subtitle }) => (
    <div style={{
      background: gradient,
      padding: '1.25rem',
      borderRadius: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      border: `1px solid ${color}`,
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = `0 8px 20px rgba(0, 0, 0, 0.15)`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
    }}
    >
      {/* Background gradient accent */}
      <div style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: "150px",
        height: "150px",
        borderRadius: "0 0 0 150px",
        opacity: 0.15,
        background: gradient,
        zIndex: 0
      }} />
      
      {/* Icon in styled container */}
      <div style={{ 
        background: `${color}25`,
        borderRadius: '10px',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '0.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        <Icon size={22} color={color} />
      </div>      {/* Value with white text */}
      <div style={{ 
        fontSize: '1.75rem', 
        fontWeight: '700', 
        color: 'white',
        marginBottom: '0.25rem',
        position: 'relative',
        zIndex: 1
      }}>
        {value}
      </div>
      
      {/* Title */}
      <div style={{ 
        fontSize: '0.9rem', 
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: '0.05rem',
        position: 'relative',
        zIndex: 1
      }}>
        {title}
      </div>
      
      {/* Subtitle */}
      {subtitle && (
        <div style={{ 
          fontSize: '0.85rem', 
          color: '#94a3b8',
          position: 'relative',
          zIndex: 1
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
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
            Welcome back {userStats.name}!
          </h1>
          <p style={{ 
            color: "#94a3b8", 
            fontSize: "1.1rem",
            maxWidth: "600px",
            margin: 0
          }}>
            Track your progress, check leaderboards and continue your learning journey
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
        
        <h2 style={{ 
          fontSize: '1.4rem', 
          fontWeight: '600', 
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ 
            background: 'rgba(74, 222, 128, 0.2)',
            borderRadius: '10px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          PROGRESS
        </h2>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '2rem',
          position: 'relative',
          zIndex: 1
        }}>          <div style={{
            width: '150px',
            height: '150px',
            position: 'relative',
            marginRight: '2rem'
          }}>
            <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="3"
                strokeDasharray={`${userStats.progress}, 100`}
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4ade80" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '2rem',
              fontWeight: 'bold',
              color: 'white'
            }}>
              {userStats.progress}%
            </div>
          </div>
          <div style={{
            fontSize: '1.1rem',
            lineHeight: '1.6',
            color: '#e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div style={{ marginBottom: '1rem', fontWeight: '600', fontSize: '1.3rem' }}>
              <span style={{ 
                background: "linear-gradient(to right, #4ade80, #3b82f6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>
                {userStats.progress}% Overall Progress
              </span>
            </div>
            
            <div style={{ 
              fontSize: '1.1rem', 
              color: '#e2e8f0',
              maxWidth: '400px',
              fontStyle: 'italic'
            }}>
              {userStats.progress === 0 && (
                "Your crypto journey begins today. Take your first step!"
              )}
              {userStats.progress > 0 && userStats.progress <= 10 && (
                "You've started your crypto adventure. Keep exploring to unlock more knowledge!"
              )}
              {userStats.progress > 10 && userStats.progress <= 20 && (
                "Building a solid foundation. You're on the right track!"
              )}
              {userStats.progress > 20 && userStats.progress <= 30 && (
                "Great progress! You're learning the basics of crypto trading."
              )}
              {userStats.progress > 30 && userStats.progress <= 40 && (
                "You're developing good crypto understanding. Keep it up!"
              )}
              {userStats.progress > 40 && userStats.progress <= 50 && (
                "Halfway there! You're becoming more knowledgeable every day."
              )}
              {userStats.progress > 50 && userStats.progress <= 60 && (
                "You're now more informed than most crypto beginners out there!"
              )}
              {userStats.progress > 60 && userStats.progress <= 70 && (
                "Impressive progress! You're building a comprehensive understanding."
              )}
              {userStats.progress > 70 && userStats.progress <= 80 && (
                "You're well on your way to becoming a crypto expert!"
              )}
              {userStats.progress > 80 && userStats.progress <= 90 && (
                "Outstanding work! You're mastering the crypto ecosystem."
              )}
              {userStats.progress > 90 && userStats.progress < 100 && (
                "So close! Just a little more to become a crypto master."
              )}
              {userStats.progress === 100 && (
                "🏆 Congratulations! You've mastered all aspects of crypto education!"
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2.5rem'
      }}>        <StatCard
          icon={BookOpen}
          title="Courses"
          value={`${userStats.completedCourses}/${userStats.totalCourses}`}
          color="#4ade80"
          gradient="linear-gradient(135deg, rgba(74, 222, 128, 0.05), rgba(34, 197, 94, 0.15))"
          subtitle="Completed courses"
        />
        <StatCard
          icon={Zap}
          title="Day Streak"
          value={userStats.streak}
          color="#FF6B6B"
          gradient="linear-gradient(135deg, rgba(255, 107, 107, 0.05), rgba(255, 84, 84, 0.15))"
          subtitle="Come back tomorrow to not lose it"
        />
        <StatCard
          icon={Trophy}
          title="Level"
          value={userStats.level}
          color="#FFD700"
          gradient="linear-gradient(135deg, rgba(255, 215, 0, 0.05), rgba(255, 182, 0, 0.15))"
          subtitle="Current level, based on XP"
        />
        <StatCard
          icon={Gift}
          title="Achievements"
          value={`${userStats.badges}/${userStats.totalAchievements}`}
          color="#A78BFA"
          gradient="linear-gradient(135deg, rgba(167, 139, 250, 0.05), rgba(139, 92, 246, 0.15))"
          subtitle="Total achievements completed"
        />
      </div>

      {/* Add the HomeLeaderboard component */}
      <HomeLeaderboard />
    </div>
  );
}
