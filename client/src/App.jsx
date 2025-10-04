import React, { useState, useEffect } from "react";
import "./App.css";
import Header from "./components/Header";
import AllNews from "./components/AllNews";
import TopHeadlines from "./components/TopHeadlines";
import { BrowserRouter, Route, Routes, useNavigate, Navigate } from "react-router-dom";
import CountryNews from "./components/CountryNews";
import SavedArticles from "./components/SavedArticles";
import Login from "./components/Login";

const MainApp = () => {
  // Initialize authentication state by checking for a token in local storage
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const navigate = useNavigate();

  useEffect(() => {
    // Re-check token status on component mount
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <div className="w-full">
      <Header isAuthenticated={isAuthenticated} handleLogout={handleLogout} />
      <Routes>
        {/* Public and Conditional Routes */}
        <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/" replace /> : <Login setAuth={setIsAuthenticated} />} 
        />
        <Route 
            path="/" 
            element={<AllNews isAuthenticated={isAuthenticated} />} 
        />
        <Route 
            path="/top-headlines/:category" 
            element={<TopHeadlines isAuthenticated={isAuthenticated} />} 
        />
        <Route 
            path="/country/:iso" 
            element={<CountryNews isAuthenticated={isAuthenticated} />} 
        />
        
        {/* Protected Route */}
        <Route 
            path="/saved" 
            element={isAuthenticated ? <SavedArticles /> : <ProtectedMessage />} 
        />
      </Routes>
    </div>
  );
};

const ProtectedMessage = () => (
    <div className="p-8 text-center text-xl text-gray-600">
        You must be logged in to view your saved articles.
    </div>
);

function App() {
    return (
        <BrowserRouter>
            <MainApp />
        </BrowserRouter>
    );
}

export default App;