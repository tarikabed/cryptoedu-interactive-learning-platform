import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import logo from './logo.svg';
import './App.css';
import Trader from './pages/Trader'
import Navbar from './components/Navbar';

function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        <Route path="/trader" element={<Trader />} />
      </Routes>
    </Router>
  );
}

export default App;
