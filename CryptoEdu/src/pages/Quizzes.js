import React from "react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseAPI";
import { LockKeyhole, Wallet, FileCode2, ChartLine, Globe, PaintBucket, Shield, Calculator, Book,
  AlertTriangle, Target, Landmark, History, Network, Key, Lightbulb, Award, Check, TrendingUp } from 'lucide-react';

const iconMap = {
  'LockKeyhole': LockKeyhole,
  'Wallet': Wallet,
  'FileCode2': FileCode2,
  'ChartLine': ChartLine,
  'Globe': Globe,
  'PaintBucket': PaintBucket,
  'Shield': Shield,
  'Calculator': Calculator,
  'Book': Book,
  'AlertTriangle': AlertTriangle,
  'Target': Target,
  'Bank': Landmark,
  'History': History,
  'Network': Network,
  'Key': Key,
  'Lightbulb': Lightbulb
};

// Modern design for Quizzes page
const Quizzes = () => {
  const [quizTopics, setQuizTopics] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [streak, setStreak] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizData();
    fetchUserProgress();
    fetchUserStats();
  }, []);

  const fetchQuizData = async () => {
    const { data: topics, error } = await supabase
      .from('quiz_topics')
      .select(`
        *,
        quiz_questions(count)
      `);
    
    if (error) {
      console.error('Error fetching quiz topics:', error);
      return;
    }

    const topicsWithIcons = topics.map(topic => ({
      ...topic,
      icon: iconMap[topic.icon_name],
      questionsCount: topic.quiz_questions[0].count
    }));

    setQuizTopics(topicsWithIcons);
  };

  const fetchUserProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: progress, error } = await supabase
      .from('user_quiz_progress')
      .select('topic_id, is_correct')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error fetching user progress:', error);
      return;
    }

    const progressByTopic = progress.reduce((acc, curr) => {
      if (!acc[curr.topic_id]) {
        acc[curr.topic_id] = { completed: 0, correct: 0 };
      }
      acc[curr.topic_id].completed++;
      if (curr.is_correct) {
        acc[curr.topic_id].correct++;
      }
      return acc;
    }, {});

    setUserProgress(progressByTopic);
  };

  const fetchUserStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: stats, error } = await supabase
      .from('user_stats')
      .select('streak_count, total_xp')
      .eq('user_id', user.id)
      .single();
      if (error) {
      if (error.code === 'PGRST116') {
        // Record not found, but we don't need to create it here as it should already be created during signup
        console.log('User stats not found but should be created during signup');
      } else {
        console.error('Error fetching user stats:', error);
      }
      return;
    }

    if (stats) {
      setStreak(stats.streak_count);
      setTotalXP(stats.total_xp);
    }
  };

  // Modern Quiz Card design with hover effects and gradient backgrounds
  const QuizCard = ({ quiz }) => {
    const progress = userProgress[quiz.id] || { completed: 0, correct: 0 };
    const progressPercentage = quiz.questionsCount ? 
      Math.round((progress.completed / quiz.questionsCount) * 100) : 0;
    
    const isCompleted = progressPercentage === 100;
    const isStarted = progressPercentage > 0 && progressPercentage < 100;

    // Generate gradient based on quiz color
    const createGradient = (baseColor) => {
      return `linear-gradient(135deg, ${baseColor}, ${baseColor}cc)`;
    };

    return (
      <div
        onClick={() => navigate(`/quizzes/${quiz.id}`)}
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "16px",
          padding: "1.5rem",
          border: `1px solid ${isCompleted ? '#4ade80' : isStarted ? quiz.color : 'rgba(255, 255, 255, 0.1)'}`,
          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
          transition: "all 0.3s ease",
          position: "relative",
          overflow: "hidden",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-5px)";
          e.currentTarget.style.boxShadow = "0 12px 25px rgba(0, 0, 0, 0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0px)";
          e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.15)";
        }}
      >
        {/* Background gradient accent */}
        <div style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "120px",
          height: "120px",
          borderRadius: "0 0 0 100%",
          background: createGradient(quiz.color),
          opacity: 0.15,
          zIndex: 0
        }} />
        
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          marginBottom: "1rem",
          position: "relative", 
          zIndex: 1 
        }}>
          <div style={{ 
            background: quiz.color,
            borderRadius: "14px",
            width: "50px",
            height: "50px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: "1rem",
            boxShadow: `0 4px 12px ${quiz.color}66`
          }}>
            {isCompleted ? (
              <Check size={28} color="#fff" />
            ) : (
              quiz.icon && <quiz.icon size={28} color="#fff" />
            )}
          </div>
          
          <div>
            <h3 style={{ 
              margin: 0,
              fontSize: "1.2rem", 
              fontWeight: "600",
              color: "white"
            }}>
              {quiz.title}
            </h3>
            <div style={{ 
              color: "#94a3b8",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              marginTop: "4px"
            }}>
              <Book size={14} /> {quiz.questionsCount} questions
            </div>
          </div>
          
          {/* XP badge */}
          <div style={{
            marginLeft: "auto",
            backgroundColor: "rgba(74, 222, 128, 0.15)",
            color: "#4ade80",
            padding: "0.3rem 0.6rem",
            borderRadius: "20px",
            fontSize: "0.85rem",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}>
            <Award size={14} /> {quiz.xp_reward} XP
          </div>
        </div>
        
        {/* Progress indicator */}
        <div style={{ marginTop: "auto", zIndex: 1 }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.5rem"
          }}>
            <span style={{ 
              color: isCompleted ? "#4ade80" : isStarted ? "#3b82f6" : "#94a3b8",
              fontSize: "0.85rem",
              fontWeight: "500"
            }}>
              {isCompleted 
                ? "Completed" 
                : isStarted 
                  ? `${progressPercentage}% Complete` 
                  : "Not started"}
            </span>
            {isStarted && !isCompleted && (
              <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                {Math.round(progress.completed / quiz.questionsCount * 100)}%
              </span>
            )}
          </div>
          
          {/* Progress bar */}
          <div style={{
            height: "6px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: "3px",
            overflow: "hidden"
          }}>
            <div style={{
              width: `${progressPercentage}%`,
              height: "100%",
              backgroundColor: isCompleted ? "#4ade80" : quiz.color,
              borderRadius: "3px",
              transition: "width 0.3s ease"
            }} />
          </div>
        </div>
      </div>
    );
  };
  // Display all topics without categorization
  return (
    <div style={{ 
      padding: "2rem",
      maxWidth: "1200px",
      margin: "0 auto"
    }}>
      {/* Header section with stats */}
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
            Crypto Quizzes
          </h1>
          <p style={{ 
            color: "#94a3b8", 
            fontSize: "1.1rem",
            maxWidth: "600px",
            margin: 0
          }}>
            Test your knowledge and earn XP as you master crypto concepts
          </p>
        </div>
        
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "1.5rem"
        }}>
          {/* Streak counter */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(255, 165, 0, 0.1)",
            padding: "0.75rem 1.25rem",
            borderRadius: "12px",
            border: streak > 0 ? "1px solid rgba(255, 165, 0, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)"
          }}>
            <div style={{ 
              background: "linear-gradient(135deg, #ff9500, #ff5e3a)", 
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: "1.5rem"
            }}>
              🔥
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: "700", fontSize: "1.1rem" }}>{streak}</div>
              <div style={{ color: "#94a3b8", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05rem" }}>day streak</div>
            </div>
          </div>
          
          {/* XP counter */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(74, 222, 128, 0.1)",
            padding: "0.75rem 1.25rem",
            borderRadius: "12px",
            border: "1px solid rgba(74, 222, 128, 0.3)"
          }}>
            <div style={{ 
              background: "linear-gradient(135deg, #4ade80, #10b981)", 
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: "1.5rem"
            }}>
              ⭐
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: "700", fontSize: "1.1rem" }}>{totalXP}</div>
              <div style={{ color: "#94a3b8", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05rem" }}>total xp</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Featured tracker */}
      <div style={{
        background: "linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(74, 222, 128, 0.1))",
        borderRadius: "16px",
        padding: "1.5rem",
        marginBottom: "3rem",
        border: "1px solid rgba(59, 130, 246, 0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div>
          <h2 style={{ 
            color: "white", 
            fontSize: "1.3rem",
            fontWeight: "600",
            margin: "0 0 0.5rem 0",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <TrendingUp size={20} color="#3b82f6" /> Your Investor Journey
          </h2>
          <p style={{ color: "#94a3b8", margin: 0 }}>
            Complete all quizzes to become a crypto expert and earn badges
          </p>
        </div>
        
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "white", fontSize: "1.5rem", fontWeight: "700" }}>
              {Object.values(userProgress).filter(p => p.completed === p.correct && p.completed > 0).length}
              <span style={{ color: "#94a3b8", fontSize: "1rem", fontWeight: "400" }}>/{quizTopics.length}</span>
            </div>
            <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>Quizzes Completed</div>
          </div>
          
          <div style={{
            height: "40px",
            width: "1px",
            background: "rgba(255, 255, 255, 0.1)",
            margin: "0 0.5rem"
          }}></div>
            <div style={{ textAlign: "center" }}>
            <div style={{ color: "white", fontSize: "1.5rem", fontWeight: "700" }}>
              {Math.floor(totalXP / 200) + 1}
            </div>
            <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>Current Level</div>
          </div>
        </div>      </div>      {/* All quizzes in a grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        columnGap: "1.5rem",
        rowGap: "5rem"
      }}>
        {quizTopics.map(quiz => (
          <QuizCard key={quiz.id} quiz={quiz} />
        ))}
      </div>
    </div>
  );
};

export default Quizzes;