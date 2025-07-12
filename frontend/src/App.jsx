import React from 'react'; 
import { Routes, Route, Navigate, Outlet } from "react-router-dom"; 
import Detail from "./pages/Detail"; 
import Aihelper from './pages/aihelper'; 
import Navbar from './pages/Navbar'; 
import Home from './pages/Home'; 
import About from './pages/About'; 
import Dashboard from './pages/Dashboard'; 
import Mealplanner from './pages/MealPlanner';
import GetStarted from './pages/GetStarted'; // New page for get started
import { MealPlanProvider } from './context/MealPlanContext'; 
import { AuthProvider } from "./context/AuthContext"; 
import ProtectedRoute from "./components/ProtectedRoute"; 
import Signup from "./pages/Signup"; 
import Login from "./pages/Login"; 
import Error from "./pages/Error";  
import ImageRecognition from './pages/Imagerecognition';

// Layout component with Navbar 
const NavbarLayout = () => {   
  return (     
    <>       
      <Navbar />       
      <Outlet />     
    </>   
  ); 
};  

function App() {   
  return (     
    <AuthProvider>
      <MealPlanProvider>       
        <Routes>
          {/* Initial redirect to login */}
          <Route path="/" element={<Navigate replace to="/home" />} />
          
          {/* Public routes without Navbar */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/get-started" element={<GetStarted />} />
                    
          {/* Routes with Navbar */}
          <Route element={<NavbarLayout />}>
            <Route path="/about" element={<About />} />
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/home" element={<Home />} />add .
              <Route path="/aihelper" element={<Aihelper />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/meal-planner" element={<Mealplanner />} />
              <Route path="/detail" element={<Detail />} />
              <Route path="/imagerecognition" element={<ImageRecognition />} />
            </Route>
          </Route>
          
          {/* Catch-all error route */}
          <Route path="*" element={<Error />} />
        </Routes>
      </MealPlanProvider>
    </AuthProvider>   
  ); 
}  

export default App;
