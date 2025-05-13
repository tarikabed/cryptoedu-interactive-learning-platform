import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { courses } from "../data/mockCourses";
import { supabase } from "../supabaseAPI";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const LessonPage = () => {
  const { id, lessonId } = useParams();
  const navigate = useNavigate();  const [loading, setLoading] = useState(false);
  const [courseProgress, setCourseProgress] = useState({
    progress: 0,
    lastLessonIndex: 0
  });

  const course = courses.find((c) => c.id === parseInt(id));
  
  // Flatten all lessons from all sections
  const allLessons = course?.sections.flatMap(section => section.lessons);
  const lessonIndex = parseInt(lessonId) - 1;
  const lesson = allLessons?.[lessonIndex];
  
  // Calculate total number of lessons
  const totalLessons = allLessons?.length || 0;
  
  // Check if this is the final lesson in the course
  const isLastLesson = lessonIndex === allLessons?.length - 1;

  // Calculate current progress percentage (how many lessons completed out of total)
  const currentProgressPercentage = totalLessons > 0 ? ((lessonIndex + 1) / totalLessons) * 100 : 0;

  // Fetch user's course progress
  const fetchCourseProgress = useCallback(async () => {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      // Get user's progress for this course
      const { data, error } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', parseInt(id))
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching course progress:', error);
        return;
      }
      
      if (data) {
        setCourseProgress({
          progress: data.progress_percentage || 0,
          lastLessonIndex: data.last_lesson_index || 0
        });
      }
    } catch (err) {
      console.error('Error in fetchCourseProgress:', err);
    }
  }, [id]);

  // Update user's course progress
  const updateCourseProgress = useCallback(async (newLessonIndex) => {
    // First, optimistically update the UI to make it feel faster
    const lessonsTaken = newLessonIndex + 1;
    const newProgress = totalLessons > 0 ? Math.min(100, (lessonsTaken / totalLessons) * 100) : 0;
    
    // Update the progress in state immediately
    setCourseProgress({
      progress: newProgress,
      lastLessonIndex: newLessonIndex
    });
    
    // Now perform the actual database update
    try {
      setLoading(true);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }
      
      // Check if we already have a progress record
      const { data, error: fetchError } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', parseInt(id))
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching course progress:', fetchError);
        setLoading(false);
        return;
      }
      
      if (data) {
        // If we have an existing record, only update if the new progress is higher
        if (newProgress > data.progress_percentage || newLessonIndex > data.last_lesson_index) {
          await supabase
            .from('user_course_progress')
            .update({
              progress_percentage: Math.max(newProgress, data.progress_percentage),
              last_lesson_index: newLessonIndex,
              updated_at: new Date().toISOString()
            })
            .eq('id', data.id);
        }
      } else {
        // If we don't have a record, create one
        await supabase
          .from('user_course_progress')
          .insert({
            user_id: user.id,
            course_id: parseInt(id),
            progress_percentage: newProgress,
            last_lesson_index: newLessonIndex,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()          });
      }
      
      // If this is the last lesson and complete, award XP and CryptoBux
      if (isLastLesson && newProgress === 100) {
        try {
          // Award 400 XP for course completion
          const { data: statsData } = await supabase
            .from('user_stats')
            .select('total_xp')
            .eq('user_id', user.id)
            .single();
            
          if (statsData) {
            await supabase
              .from('user_stats')
              .update({ 
                total_xp: statsData.total_xp + 400,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id);
          }
          
          // Award 25000 CryptoBux for course completion
          const { data: portfolioData } = await supabase
            .from('user_portfolio')
            .select('cryptobux_balance')
            .eq('user_id', user.id)
            .single();
            
          if (portfolioData) {
            await supabase
              .from('user_portfolio')
              .update({ 
                cryptobux_balance: portfolioData.cryptobux_balance + 25000,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id);
          }
          
          // Count completed courses to check for achievements
          const { data: completedCoursesData } = await supabase
            .from('user_course_progress')
            .select('course_id')
            .eq('user_id', user.id)
            .gte('progress_percentage', 100);
          
          const completedCoursesCount = completedCoursesData?.length || 0;
          
          // Get achievements for course completion
          const { data: courseAchievements } = await supabase
            .from('achievements')
            .select('*')
            .eq('requirement_type', 'courses_completed');
            
          if (courseAchievements?.length > 0) {
            // Check each achievement to see if it should be unlocked
            for (const achievement of courseAchievements) {
              if (completedCoursesCount >= achievement.requirement_value) {
                // Check if achievement is already unlocked
                const { data: existingAchievement } = await supabase
                  .from('user_achievements')
                  .select('*')
                  .eq('user_id', user.id)
                  .eq('achievement_id', achievement.id)
                  .single();
                  // If not already unlocked, add it
                if (!existingAchievement) {
                  await supabase
                    .from('user_achievements')
                    .insert({
                      user_id: user.id,
                      achievement_id: achievement.id,
                      unlocked_at: new Date().toISOString()
                    });                  // Award 400 XP for unlocking an achievement
                  const { data: currentUserStats } = await supabase
                    .from('user_stats')
                    .select('total_xp')
                    .eq('user_id', user.id)
                    .single();
                    
                  if (currentUserStats) {
                    await supabase
                      .from('user_stats')
                      .update({ total_xp: currentUserStats.total_xp + 400 })
                      .eq('user_id', user.id);
                  }
                  
                  // Award CryptoBux for achievement completion (25000 or 40000 based on achievement id)
                  const rewardAmount = achievement.id % 2 === 0 ? 40000 : 25000;
                  const { data: portfolioData } = await supabase
                    .from('user_portfolio')
                    .select('cryptobux_balance')
                    .eq('user_id', user.id)
                    .single();
                    
                  if (portfolioData) {
                    await supabase
                      .from('user_portfolio')
                      .update({ 
                        cryptobux_balance: portfolioData.cryptobux_balance + rewardAmount,
                        updated_at: new Date().toISOString()
                      })
                      .eq('user_id', user.id);
                  }
                      // Could show a notification here that achievement was unlocked
                }
              }
            }
          }
        } catch (error) {
          console.error('Error processing course completion achievements:', error);
        }
      }
    } catch (err) {
      console.error('Error updating course progress:', err);
    } finally {
      setLoading(false);
    }
  }, [id, isLastLesson, totalLessons]);

  useEffect(() => {
    if (course) {
      fetchCourseProgress();
    }
  }, [course, fetchCourseProgress]);

  // When the user loads a lesson, update their last viewed lesson index
  useEffect(() => {
    if (course && lessonIndex !== undefined) {
      // Update the last lesson index, but don't update progress percentage yet
      // Progress only increases when proceeding to next lesson
      const updateLastViewedLesson = async () => {
        try {
          // Get the current user
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) return;
          
          // Update local state immediately for a responsive UI
          setCourseProgress(prev => ({
            ...prev,
            lastLessonIndex: lessonIndex
          }));
          
          // Check if we already have a progress record
          const { data, error: fetchError } = await supabase
            .from('user_course_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('course_id', parseInt(id))
            .single();
          
          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error fetching course progress:', fetchError);
            return;
          }
          
          if (data) {
            // Only update the last lesson index
            await supabase
              .from('user_course_progress')
              .update({
                last_lesson_index: lessonIndex,
                updated_at: new Date().toISOString()
              })
              .eq('id', data.id);
          } else {
            // Create a new record with 0% progress but tracking the current lesson
            await supabase
              .from('user_course_progress')
              .insert({
                user_id: user.id,
                course_id: parseInt(id),
                progress_percentage: 0,
                last_lesson_index: lessonIndex,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
          }
        } catch (err) {
          console.error('Error updating last viewed lesson:', err);
        }
      };
      
      updateLastViewedLesson();
    }
  }, [id, lessonIndex, course]);

  if (!course || !lesson) return <div style={{ color: "white" }}>Lesson not found</div>;

  const goToNextLessonOrComplete = () => {
    // Update progress when going to next lesson
    updateCourseProgress(lessonIndex);
    
    // Navigate immediately for better responsiveness, don't wait for the update
    if (!isLastLesson) {
      navigate(`/courses/${id}/lessons/${lessonIndex + 2}`);
    } else {
      // Complete the course and navigate back to courses page
      navigate('/courses');
    }
  };

  const goToPreviousLesson = () => {
    // Don't update progress when going back
    navigate(`/courses/${id}/lessons/${lessonIndex}`);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      {/* Course title and progress info */}
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ 
          fontSize: "0.875rem", 
          color: "#94a3b8",
          marginBottom: "0.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span>{course.title}</span>
          <span>Lesson {lessonIndex + 1} of {totalLessons}</span>
        </div>
        
        {/* Progress bar */}
        <div style={{ 
          background: "rgba(255, 255, 255, 0.1)",
          height: "4px",
          borderRadius: "2px",
          overflow: "hidden",
          marginBottom: "2rem"
        }}>
          <div style={{
            width: `${currentProgressPercentage}%`,
            height: "100%",
            backgroundColor: course.color || "#B1FEDD",
            borderRadius: "2px",
            transition: "width 0.3s ease"
          }}></div>
        </div>
      </div>
      
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem", color: "white" }}>{lesson.title}</h1>

      {lesson.videoUrl && (
        <div style={{ marginBottom: "1.5rem" }}>
          <iframe
            width="100%"
            height="400"
            src={lesson.videoUrl}
            title={lesson.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ borderRadius: "0.5rem" }}
          ></iframe>
        </div>
      )}

<div style={{ 
  fontSize: "1.3rem", 
  lineHeight: 1.7, 
  marginBottom: "2rem",
  backgroundColor: "rgba(255, 255, 255, 0.05)",
  padding: "1.5rem",
  borderRadius: "1rem",
  color: "#cbd5e0",
  border: "1px solid rgba(255, 255, 255, 0.1)"
}}>
  <ReactMarkdown 
    children={lesson.content} 
    remarkPlugins={[remarkGfm]} 
    components={{
      p: ({ node, ...props }) => <p style={{ marginBottom: "1rem" }} {...props} />,
      li: ({ node, ...props }) => <li style={{ marginLeft: "1.25rem", listStyleType: "disc" }} {...props} />
    }}
  />
</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {lessonIndex > 0 && (
          <button
            onClick={goToPreviousLesson}
            style={{
              backgroundColor: "rgba(177, 254, 221, 0.1)",
              color: "white",
              padding: "0.75rem 1.5rem",
              border: "1px solid #B1FEDD",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontWeight: "bold"
            }}
            disabled={loading}
          >
            Previous Lesson
          </button>
        )}
        
        <button
          onClick={goToNextLessonOrComplete}
          style={{
            backgroundColor: "#B1FEDD",
            color: "#1a1a2e",
            padding: "0.75rem 1.5rem",
            border: "none",
            borderRadius: "0.5rem",
            cursor: loading ? "wait" : "pointer",
            fontWeight: "bold",
            marginLeft: "auto",
            opacity: loading ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="loading-spinner" style={{ marginRight: "0.5rem" }}></span>
              Saving...
            </>
          ) : (
            isLastLesson ? "Complete Course" : "Next Lesson"
          )}
        </button>
      </div>
    </div>
  );
};

export default LessonPage;
