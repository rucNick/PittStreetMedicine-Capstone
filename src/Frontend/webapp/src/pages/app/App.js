// App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "../Login/Login";
import Home from "../Home/Home";
import Home_Feedback from "../Home/Home_Feedback"; // Feedback page component
import Home_Profile from "../Home/Home_Profile"; // profile page component
import Home_OrderHistory from "../Home/Home_OrderHistory"; // Order History page component
import Register from "../Register/Register";
import Guest from "../Guest/Guest";
import VolunteerAppli from "../Volunteer/volunteer_appli";
import Volunteer from "../Volunteer/Volunteer";
import Admin from "../Admin/Admin";
import CargoAdmin from "../Admin/Cargo_Admin";
import CargoVolunteer from "../Volunteer/Cargo_Volunteer";
import ResetPassword from "../../ResetPassword";
import Round_Admin from "../Round/Round_Admin";

function App({ securityInitialized = false }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState({ username: "", userId: null, role: "" });

  // Rehydrate state when App mounts
  useEffect(() => {
    const storedUser = sessionStorage.getItem("auth_user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserData(user);
      setIsLoggedIn(true);
    }
  }, []);

  // Save authentication state on successful login
  const handleLoginSuccess = (data) => {
    setIsLoggedIn(true);
    setUserData(data);
    sessionStorage.setItem("auth_user", JSON.stringify(data));
  };

  // On logout, clear the session data
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserData({ username: "", userId: null, role: "" });
    sessionStorage.removeItem("auth_user");
    localStorage.removeItem("ecdh_session_id");
  };

  if (!securityInitialized) {
    return (
      <div
        style={{
          margin: "20px",
          padding: "20px",
          backgroundColor: "#ffebee",
          color: "#c62828",
          borderRadius: "4px",
          textAlign: "center",
        }}
      >
        <h2>Security Error</h2>
        <p>Secure connection could not be established.</p>
        <p>Please refresh the page to try again.</p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }

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
        <Route path="/feedback" element={<Home_Feedback username={userData.username} />} />
        <Route path="/profile" element={<Home_Profile username={userData.username} email={userData.email} phone={userData.phone} userId={userData.userId} onLogout={handleLogout} />} />
        <Route path="/orderhistory" element={<Home_OrderHistory userId={userData.userId} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/guest" element={<Guest onLogout={handleLogout} />} />
        <Route path="/volunteerAppli" element={<VolunteerAppli />} />
        <Route path="/cargo_admin" element={<CargoAdmin userData={userData} />} />
        <Route path="/cargo_volunteer" element={<CargoVolunteer />} />
        <Route path="/reset_password" element={<ResetPassword />} />
        <Route path="/round_admin" element={<Round_Admin />} />
      </Routes>
    </Router>
  );
}

export default App;
