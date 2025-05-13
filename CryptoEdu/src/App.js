import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from './components/ThemeContext';
import { AuthProvider } from './AuthContext';
import './App.css';

import Navbar from './components/Navbar';
import Login from './pages/Login';
import Trader from './pages/Trader';
import Profile from './pages/Profile';
import Welcome from './pages/Welcome';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import RouteProtector from './components/RouteProtector';
import Courses from './pages/Courses';
import CourseLanding from './pages/CourseLanding';
import LessonPage from './pages/LessonPage';
import Quizzes from './pages/Quizzes';
import QuizDetail from './pages/QuizDetail';
import Achievements from './pages/Achievements';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Login />} />

            {/* Protected routes - all need Navbar */}
            <Route path="/home" element={
              <RouteProtector>
                <Navbar />
                <Home />
              </RouteProtector>
            } />
            <Route path="/trader" element={
              <RouteProtector>
                <Navbar />
                <Trader />
              </RouteProtector>
            } />
            <Route path="/profile" element={
              <RouteProtector>
                <Navbar />
                <Profile />
              </RouteProtector>
            } />
            <Route path="/achievements" element={
              <RouteProtector>
                <Navbar />
                <Achievements />
              </RouteProtector>
            } />
            <Route path="/leaderboard" element={
              <RouteProtector>
                <Navbar />
                <Leaderboard />
              </RouteProtector>
            } />
            <Route path="/courses" element={
              <RouteProtector>
                <Navbar />
                <Courses />
              </RouteProtector>
            } />
            <Route path="/courses/:id" element={
              <RouteProtector>
                <Navbar />
                <CourseLanding />
              </RouteProtector>
            } />
            <Route path="/courses/:id/lessons/:lessonId" element={
              <RouteProtector>
                <Navbar />
                <LessonPage />
              </RouteProtector>
            } />
            <Route path="/quizzes" element={
              <RouteProtector>
                <Navbar />
                <Quizzes />
              </RouteProtector>
            } />
            <Route path="/quizzes/:id" element={
              <RouteProtector>
                <Navbar />
                <QuizDetail />
              </RouteProtector>
            } />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
