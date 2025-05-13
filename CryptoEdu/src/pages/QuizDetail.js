import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, ChevronLeft, Heart, Award } from 'lucide-react';
import { supabase } from "../supabaseAPI";

const animationStyles = `
  @keyframes bounceIn {
    0% { transform: scale(0.8); opacity: 0; }
    50% { transform: scale(1.1); }
    70% { transform: scale(0.95); }
    100% { transform: scale(1); opacity: 1; }
  }
  
  @keyframes slideInRight {
    0% { transform: translateX(30px); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  
  @keyframes floatUp {
    0% { transform: translateY(0) scale(1); opacity: 1; }
    100% { transform: translateY(-50px) scale(1.2); opacity: 0; }
  }
  
  @keyframes progressBarFill {
    0% { width: 0%; }
    100% { width: 100%; }
  }
  
  @keyframes correctAnswer {
    0% { background-color: rgba(74, 222, 128, 0.1); }
    30% { background-color: rgba(74, 222, 128, 0.5); }
    100% { background-color: rgba(74, 222, 128, 0.2); }
  }
  
  @keyframes wrongAnswer {
    0% { background-color: rgba(239, 68, 68, 0.1); }
    30% { background-color: rgba(239, 68, 68, 0.5); }
    100% { background-color: rgba(239, 68, 68, 0.2); }
  }
`;

export default function QuizDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  const [showXPAnimation, setShowXPAnimation] = useState(false);
  const [hearts, setHearts] = useState(3);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
  const [answerResult, setAnswerResult] = useState(null); // 'correct' or 'wrong'
  const [incorrectQuestions, setIncorrectQuestions] = useState([]); // Store questions that were answered incorrectly
  const [isReviewMode, setIsReviewMode] = useState(false); // Whether we're reviewing incorrect questions
  const [reviewIndex, setReviewIndex] = useState(0); // Current index in the incorrect questions array

  const fetchQuizData = useCallback(async () => {
    const { data: quizData, error: quizError } = await supabase
      .from('quiz_topics')
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (quizError) {
      console.error('Error fetching quiz:', quizError);
      return;
    }

    setQuiz(quizData);

    const { data: questionData, error: questionError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('topic_id', parseInt(id))
      .order('id');

    if (questionError) {
      console.error('Error fetching questions:', questionError);
      return;
    }

    setQuestions(questionData);
  }, [id]);

  useEffect(() => {
    fetchQuizData();
  }, [id, fetchQuizData]);

  // Get the current question based on whether we're in review mode or normal mode
  const currentQuestion = isReviewMode 
    ? incorrectQuestions[reviewIndex]
    : questions[currentQuestionIndex];

  const handleAnswer = async (answerIndex) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answerIndex);
    setIsAnswered(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const isCorrect = answerIndex === currentQuestion.correct_answer;
    setAnswerResult(isCorrect ? 'correct' : 'wrong');
    
    // Only award XP if in normal mode and answers correctly
    const xpGained = isCorrect && !isReviewMode ? Math.round(quiz.xp_reward / questions.length) : 0;

    // In review mode, remove the question from incorrect list if answered correctly
    if (isReviewMode && isCorrect) {
      const updatedIncorrectQuestions = [...incorrectQuestions];
      updatedIncorrectQuestions.splice(reviewIndex, 1);
      setIncorrectQuestions(updatedIncorrectQuestions);
    }
    
    // If in normal mode and answering incorrectly, add to incorrect questions
    if (!isReviewMode && !isCorrect) {
      setIncorrectQuestions(prev => [...prev, currentQuestion]);
      
      // Lose a heart
      setHearts(prev => Math.max(0, prev - 1));
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 1000);
      
      // If all hearts are gone, redirect to quizzes page after delay
      if (hearts <= 1) {
        setTimeout(() => navigate('/quizzes'), 3000);
      }
    }

    const { error: progressError } = await supabase
      .from('user_quiz_progress')
      .insert({
        user_id: user.id,
        topic_id: parseInt(id),
        question_id: currentQuestion.id,
        selected_answer: answerIndex,
        is_correct: isCorrect,
        completed: true,
        completed_at: new Date().toISOString()
      });

    if (progressError) {
      console.error('Error saving progress:', progressError);
      return;
    }

    if (xpGained > 0) {
      const { data: userStats, error: statsError } = await supabase
        .from('user_stats')
        .select('total_xp')
        .eq('user_id', user.id)
        .single();

      if (!statsError && userStats) {
        await supabase
          .from('user_stats')
          .update({ total_xp: userStats.total_xp + xpGained })
          .eq('user_id', user.id);
      }

      setEarnedXP(prev => prev + xpGained);
      setShowXPAnimation(true);
      setTimeout(() => setShowXPAnimation(false), 2000);
    }
  };

  const nextQuestion = () => {
    // If in review mode
    if (isReviewMode) {
      if (reviewIndex < incorrectQuestions.length - 1) {
        // Move to next incorrect question
        setReviewIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setAnswerResult(null);
      } else if (incorrectQuestions.length === 0) {
        // All review questions answered correctly, show completion
        finishQuiz();
      } else {
        // Start over with remaining incorrect questions
        setReviewIndex(0);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setAnswerResult(null);
      }
      return;
    }
    
    // If in normal mode
    if (currentQuestionIndex < questions.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setAnswerResult(null);
    } else {
      // Finished all normal questions, check if there are incorrect ones to review
      if (incorrectQuestions.length > 0) {
        // Start review mode
        setIsReviewMode(true);
        setReviewIndex(0);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setAnswerResult(null);
      } else {
        // No incorrect questions, quiz complete
        finishQuiz();
      }
    }
  };

  const finishQuiz = () => {
    setShowCompletionAnimation(true);
    setTimeout(() => navigate('/quizzes'), 3000);
  };

  if (!quiz || !currentQuestion) {
    return (
      <div style={{ 
        padding: "2rem", 
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "50vh" 
      }}>
        <div style={{
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.3)",
          borderTopColor: "#4ade80",
          animation: "spin 1s linear infinite"
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: "1rem",
      maxWidth: "800px",
      margin: "0 auto",
      position: "relative"
    }}>
      <style>{animationStyles}</style>
      
      {/* Back button */}
      <div 
        onClick={() => navigate('/quizzes')} 
        style={{ 
          display: "flex", 
          alignItems: "center", 
          color: "white", 
          cursor: "pointer",
          marginBottom: "1.5rem",
          width: "fit-content"
        }}
      >
        <ChevronLeft size={20} />
        <span style={{ marginLeft: "0.5rem" }}>Back to Quizzes</span>
      </div>
      
      {/* Educational Risk Warning */}
      {currentQuestionIndex === 0 && !isReviewMode && (
        <div style={{
          background: "rgba(239, 68, 68, 0.1)",
          borderRadius: "12px",
          padding: "1rem",
          marginBottom: "1.5rem",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          animation: "slideInRight 0.5s ease-out"
        }}>
          <p style={{ 
            color: "#cbd5e0", 
            margin: "0",
            fontSize: "0.95rem",
            lineHeight: "1.5"
          }}>
            <span style={{ color: "#ef4444", fontWeight: "600", display: "block", marginBottom: "0.25rem" }}>
              Educational Content Notice:
            </span>
            This educational platform is designed to teach concepts in a risk-free environment. The knowledge you gain here should be supplemented with additional research before making any real-world financial decisions. Cryptocurrency investments involve significant risks including potential loss of capital.
          </p>
        </div>
      )}
      
      {/* Top status bar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "2rem"
      }}>
        {/* Progress bar - shows review mode or normal mode progress */}
        <div style={{
          flex: 1,
          height: "12px",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          borderRadius: "10px",
          overflow: "hidden",
          marginRight: "1rem"
        }}>
          <div style={{
            width: isReviewMode 
              ? `${100 - ((incorrectQuestions.length / (incorrectQuestions.length + 1)) * 100)}%`
              : `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
            height: "100%",
            backgroundColor: isReviewMode ? "#FFA500" : "#4ade80",
            borderRadius: "10px",
            transition: "width 0.5s ease"
          }} />
        </div>

        {/* Mode indicator */}
        {isReviewMode && (
          <div style={{
            backgroundColor: "rgba(255, 165, 0, 0.2)",
            color: "#FFA500",
            padding: "0.4rem 0.8rem",
            borderRadius: "1rem",
            fontSize: "0.8rem",
            fontWeight: "bold",
            marginRight: "1rem"
          }}>
            REVIEW MODE
          </div>
        )}
        
        {/* Hearts */}
        <div style={{
          display: "flex",
          gap: "0.5rem",
          alignItems: "center"
        }}>
          {[...Array(hearts)].map((_, i) => (
            <Heart 
              key={i} 
              fill="#ef4444" 
              color="#ef4444" 
              size={20} 
              style={{
                animation: i === hearts - 1 && showHeartAnimation ? "pulse 0.5s ease" : "none"
              }}
            />
          ))}
        </div>
      </div>

      {/* XP Animation */}
      {showXPAnimation && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "#4ade80",
          color: "white",
          fontWeight: "bold",
          padding: "0.75rem 1.5rem",
          borderRadius: "1rem",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          zIndex: 100,
          animation: "floatUp 2s ease-out forwards"
        }}>
          +{Math.round(quiz.xp_reward / questions.length)} XP
        </div>
      )}

      {/* Quiz completion animation */}
      {showCompletionAnimation && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.7)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 200,
          animation: "bounceIn 0.5s ease"
        }}>
          <div style={{
            backgroundColor: "rgba(74, 222, 128, 0.2)",
            borderRadius: "2rem",
            padding: "2rem",
            textAlign: "center",
            maxWidth: "400px"
          }}>
            <div style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              backgroundColor: "#4ade80",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              margin: "0 auto 1.5rem"
            }}>
              <Award size={40} color="#fff" />
            </div>
            
            <h2 style={{ color: "#4ade80", fontSize: "1.75rem", marginBottom: "1rem" }}>
              Quiz Complete! 🎉
            </h2>
            
            <p style={{ color: "white", fontSize: "1.2rem", marginBottom: "1rem" }}>
              Congratulations! You've earned:
            </p>
            
            <div style={{
              backgroundColor: "rgba(74, 222, 128, 0.2)",
              padding: "0.75rem",
              borderRadius: "1rem",
              marginBottom: "1rem",
              color: "#4ade80",
              fontWeight: "bold",
              fontSize: "1.5rem"
            }}>
              {earnedXP} XP
            </div>
            
            <p style={{ color: "#cbd5e0" }}>
              Returning to quizzes...
            </p>
          </div>
        </div>
      )}

      {/* Question container */}
      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        padding: "1.5rem",
        borderRadius: "1.5rem",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        animation: "bounceIn 0.3s ease",
        borderTop: `4px solid ${isReviewMode ? "#FFA500" : quiz.color}`
      }}>
        {/* Quiz title */}
        <div style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "1.5rem",
          gap: "0.75rem"
        }}>
          <div style={{
            backgroundColor: isReviewMode ? "#FFA500" : quiz.color,
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <span style={{ color: "#fff", fontSize: "1.2rem" }}>
              {isReviewMode ? "R" : `Q${currentQuestionIndex + 1}`}
            </span>
          </div>
          <h3 style={{ color: "white", fontSize: "1rem", margin: 0 }}>
            {quiz.title} {isReviewMode ? "- Review" : ""}
          </h3>
        </div>

        <h2 style={{ 
          fontSize: "1.5rem", 
          marginBottom: "2rem",
          color: "white",
          fontWeight: "500",
          lineHeight: "1.4",
        }}>
          {currentQuestion.question}
        </h2>

        {/* Answer options */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = index === selectedAnswer;
            const isCorrect = index === currentQuestion.correct_answer;
            const showCorrect = isAnswered && isCorrect;
            const showIncorrect = isAnswered && isSelected && !isCorrect;
            
            let animationStyle = "";
            if (showCorrect) animationStyle = "correctAnswer 1s forwards";
            else if (showIncorrect) animationStyle = "wrongAnswer 1s forwards";
            
            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={isAnswered}
                style={{
                  padding: "1.2rem",
                  border: "2px solid",
                  borderColor: isAnswered
                    ? isCorrect
                      ? "#4ade80"
                      : isSelected
                      ? "#ef4444"
                      : "rgba(255, 255, 255, 0.1)"
                    : isSelected 
                      ? "rgba(255, 255, 255, 0.5)"
                      : "rgba(255, 255, 255, 0.1)",
                  borderRadius: "1rem",
                  backgroundColor: isSelected && !isAnswered 
                    ? "rgba(255, 255, 255, 0.15)"
                    : "transparent",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  animation: animationStyle,
                  transition: "all 0.2s ease",
                  fontWeight: isSelected ? "bold" : "normal",
                  position: "relative",
                  overflow: "hidden"
                }}
                onMouseEnter={(e) => !isAnswered && !isSelected && (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)")}
                onMouseLeave={(e) => !isAnswered && !isSelected && (e.currentTarget.style.backgroundColor = "transparent")}
              >
                {/* Option letter */}
                <div style={{
                  position: "absolute",
                  left: "0",
                  top: "0",
                  bottom: "0",
                  width: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isAnswered && isCorrect ? "rgba(74, 222, 128, 0.2)" :
                                   isAnswered && isSelected ? "rgba(239, 68, 68, 0.2)" :
                                   "rgba(255, 255, 255, 0.05)",
                  borderRight: "1px solid rgba(255, 255, 255, 0.1)",
                  color: isAnswered && isCorrect ? "#4ade80" :
                         isAnswered && isSelected ? "#ef4444" :
                         "#cbd5e0"
                }}>
                  {String.fromCharCode(65 + index)}
                </div>
                
                <span style={{ 
                  flex: 1, 
                  textAlign: "left",
                  marginLeft: "48px",
                  fontSize: "1.1rem"
                }}>
                  {option}
                </span>
                
                {showCorrect && (
                  <CheckCircle2 color="#4ade80" size={24} style={{ animation: "bounceIn 0.3s ease" }} />
                )}
                
                {showIncorrect && (
                  <XCircle color="#ef4444" size={24} style={{ animation: "bounceIn 0.3s ease" }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {isAnswered && (
          <div style={{
            marginTop: "1.5rem",
            padding: "1.2rem",
            backgroundColor: answerResult === 'correct' ? "rgba(74, 222, 128, 0.1)" : "rgba(239, 68, 68, 0.1)",
            borderRadius: "1rem",
            color: "#cbd5e0",
            animation: "slideInRight 0.3s ease",
            borderLeft: `4px solid ${answerResult === 'correct' ? '#4ade80' : '#ef4444'}`
          }}>
            <div style={{
              color: answerResult === 'correct' ? "#4ade80" : "#ef4444",
              fontWeight: "bold",
              marginBottom: "0.5rem",
              fontSize: "1.1rem"
            }}>
              {answerResult === 'correct' ? "Correct!" : "Incorrect!"}
            </div>
            {currentQuestion.explanation}
          </div>
        )}

        {/* Continue button */}
        {isAnswered && hearts > 0 && (
          <button
            onClick={nextQuestion}
            style={{
              marginTop: "1.5rem",
              padding: "1rem 1.5rem",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "1rem",
              cursor: "pointer",
              width: "100%",
              fontWeight: "bold",
              fontSize: "1.1rem",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
              animation: "bounceIn 0.5s ease"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
          >
            {isReviewMode 
              ? (incorrectQuestions.length <= 1 || reviewIndex === incorrectQuestions.length - 1) 
                ? "Complete Quiz" 
                : "Continue Review"
              : currentQuestionIndex < questions.length - 1 
                ? "Continue" 
                : incorrectQuestions.length > 0 
                  ? "Review Incorrect Questions" 
                  : "Complete Quiz"}
          </button>
        )}

        {/* Game over message */}
        {isAnswered && hearts === 0 && (
          <div style={{
            marginTop: "1.5rem",
            padding: "1rem",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            borderRadius: "1rem",
            textAlign: "center",
            animation: "bounceIn 0.5s ease"
          }}>
            <h3 style={{ color: "#ef4444", marginBottom: "0.5rem" }}>Out of hearts!</h3>
            <p style={{ color: "#cbd5e0", marginBottom: "1rem" }}>
              You've run out of hearts. Try again soon!
            </p>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Returning to quizzes...</p>
          </div>
        )}
      </div>
    </div>
  );
}