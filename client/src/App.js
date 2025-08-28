import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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