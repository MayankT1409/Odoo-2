import React from "react";
import { Routes, Route } from "react-router-dom";
// import Home from "./pages/Home";
// import Login from "./pages/Login";
// import Register from "./pages/Register";
// import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard.jsx";

const App = () => {
  return (
    <Routes>
      {/* <Route path="/" element={<Home />} /> */}
      {/* <Route path="/login" element={<Login />} /> */}
      {/* <Route path="/register" element={<Register />} /> */}
      {/* <Route path="/profile" element={<Profile />} /> */}
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
};

export default App;
