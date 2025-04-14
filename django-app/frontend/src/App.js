import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css';

import Navbar from './components/Navbar';
import Login from './pages/Login';
import Trader from './pages/Trader';
import Achievements from './pages/Achievements';
import Friends from './pages/Friends';
import Portfolio from './pages/Portfolio';
import Home from './pages/Home';
import RouteProtector from './components/RouteProtector';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';




function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        {/*Public routes*/}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />

        {/*Private routes (requires login)*/}
        <Route path="/trader" element={
          <RouteProtector><Trader /></RouteProtector>
        } />
        <Route path="/achievements" element={
          <RouteProtector><Achievements /></RouteProtector>
        } />
        <Route path="/friends" element={
          <RouteProtector><Friends /></RouteProtector>
        } />
        <Route path="/portfolio" element={
          <RouteProtector><Portfolio /></RouteProtector>
        } />
        <Route path="/courses" element={
        <RouteProtector><Courses /></RouteProtector>
        } />
        <Route path="/courses/:id" element={
        <RouteProtector><CourseDetail /></RouteProtector>
        } />

      </Routes>
    </Router>
  );
}

export default App;
