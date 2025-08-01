import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { SignedIn, SignedOut, SignIn, SignUp } from "@clerk/clerk-react";

// Pages
import MainPage from "./pages/MainPage.jsx";
import PreviewPage from "./components/PreviewPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Menubar from "./components/Menubar.jsx";
import LandingPage from "./pages/LandingPage/LandingPage.jsx";
import UserSyncHandler from "./components/UserSyncHandler.jsx";

// Custom Protected Route component
const ProtectedRoute = ({ children }) => {
  return (
    <>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" replace />
      </SignedOut>
    </>
  );
};

function App() {
  return (
    <Router>
      <UserSyncHandler />
      <Menubar />
      <Toaster position="top-center" />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/sign-in/*" 
          element={
            <div className="d-flex justify-content-center align-items-center min-vh-100">
              <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
            </div>
          } 
        />
        <Route 
          path="/sign-up/*" 
          element={
            <div className="d-flex justify-content-center align-items-center min-vh-100">
              <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
            </div>
          } 
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/generate"
          element={
            <ProtectedRoute>
              <MainPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/preview"
          element={
            <ProtectedRoute>
              <PreviewPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
