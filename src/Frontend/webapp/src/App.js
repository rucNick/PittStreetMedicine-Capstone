import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Home from "./Home";
import Register from "./Register";
import Guest from "./Guest";
import VolunteerAppli from "./volunteer_appli";
import Volunteer from "./Volunteer";
import Admin from "./Admin";
import CargoAdmin from "./Cargo_Admin";
import CargoVolunteer from "./Cargo_Volunteer";
import Reset_Password from "./Reset_Password";

function App({ securityInitialized = false }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState({ username: "", userId: null, role: "" });
  
  useEffect(() => {
    if (securityInitialized) {
      console.log('App started with secure connection established');
    } else {
      console.warn('App started without secure connection');
    }
  }, [securityInitialized]);
  
  const handleLoginSuccess = (data) => {
    setIsLoggedIn(true);
    setUserData(data);
  };
  
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserData({ username: "", userId: null, role: "" });
  };
  
  // Show error message if security initialization failed
  if (!securityInitialized) {
    return (
      <div style={{
        margin: '20px',
        padding: '20px',
        backgroundColor: '#ffebee',
        color: '#c62828',
        borderRadius: '4px',
        textAlign: 'center'
      }}>
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
        <Route path="/register" element={<Register />} />
        <Route path="/guest" element={<Guest onLogout={handleLogout} />} />
        <Route path="/volunteerAppli" element={<VolunteerAppli />} />
        <Route path="/cargo_admin" element={<CargoAdmin userData={userData}/>} />
        <Route path="/cargo_volunteer" element={<CargoVolunteer />} />
        <Route path="/reset_password" element={<Reset_Password />} />
      </Routes>
    </Router>
  );
}

export default App;