import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Home from "./Home";
import Register from "./Register";
import Guest from "./Guest";
import VolunteerAppli from "./volunteer_appli";
import Volunteer from "./Volunteer";
import Admin from "./Admin";  // Import the Admin component

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState({ username: "", userId: null, role: "" });

  const handleLoginSuccess = (data) => {
    setIsLoggedIn(true);
    setUserData(data);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserData({ username: "", userId: null, role: "" });
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            isLoggedIn ? (
              userData.username === "Guest" ? (
                <Guest onLogout={handleLogout} />
              ) : userData.role === "VOLUNTEER" ? (
                <Volunteer onLogout={handleLogout} userData={userData} />
              ) : userData.role === "ADMIN" ? (
                <Admin onLogout={handleLogout} userData={userData} />
              ) : (
                <Home
                  username={userData.username}
                  userId={userData.userId}
                  onLogout={handleLogout}
                />
              )
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route path="/register" element={<Register />} />
        <Route path="/guest" element={<Guest onLogout={handleLogout} />} />
        <Route path="/volunteerAppli" element={<VolunteerAppli />} />
      </Routes>
    </Router>
  );
}

export default App;
