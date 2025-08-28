/*import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Home from "./pages/Home";
import { AuthProvider } from "./context/AuthContext";
import UploadPost from "./pages/UploadPost";
import DarkModeToggle from "./DarkModeToggle";
import Profile from "./pages/Profile";
import Explore from "./pages/Explore";
import Search from "./pages/Search";

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Dark Mode Toggle always visible }*/
       /* <DarkModeToggle />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/upload" element={<UploadPost />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/search" element={<Search />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App; */
import React, { createContext, useContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// A basic, local AuthProvider to make the app runnable
const AuthContext = createContext(null);
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const value = { user, setUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Placeholder components to make the app runnable
const Login = () => <div>Login Page</div>;
const Signup = () => <div>Signup Page</div>;
const ForgotPassword = () => <div>Forgot Password Page</div>;
const ResetPassword = () => <div>Reset Password Page</div>;
const Home = () => <div>Home Page</div>;
const UploadPost = () => <div>Upload Post Page</div>;
const DarkModeToggle = () => <div className="p-4 text-center text-gray-700 bg-gray-200">Dark Mode Toggle</div>;
const Profile = () => <div>Profile Page</div>;
const Explore = () => <div>Explore Page</div>;
const Search = () => <div>Search Page</div>;

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Dark Mode Toggle always visible */}
        <DarkModeToggle />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/upload" element={<UploadPost />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/search" element={<Search />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
