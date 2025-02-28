import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Home from "./Home";
import Register from "./Register";
import Guest from "./Guest";
import VolunteerAppli from "./volunteer_appli";
import VolunteerOrders from "./VolunteerOrders";  // add volunteerorders

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
              ) : userData.role === "VOLUNTEER" ? (  // add: if User's role is VOLUNTEER
                <VolunteerOrders onLogout={handleLogout} />
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
        <Route path="/volunteer" element={<VolunteerAppli />} />
        <Route path="/VolunteerOrders" element={<VolunteerOrders onLogout={handleLogout} />} />  {/* Add VolunteerOrder route */}
      </Routes>
    </Router>
  );
}

export default App;
