import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    useLocation
} from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import GenerateQuiz from "./pages/GenerateQuiz";
import Quiz from "./pages/Quiz";
import Result from "./pages/Result";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import StudyNotes from "./pages/StudyNotes";

function AppContent() {
    const location = useLocation();

    // Hide navbar only on Login and Register pages
    const hideNavbar =
        location.pathname === "/login" ||
        location.pathname === "/register";

    return (
        <>
            {!hideNavbar && <Navbar />}

            <Routes>
                {/* Authentication */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Default Route */}
                <Route
                    path="/"
                    element={<Navigate to="/login" replace />}
                />

                {/* Main Pages */}
                <Route path="/home" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route
                    path="/generate"
                    element={<GenerateQuiz />}
                />

                {/* AI Study Notes */}
                <Route
                    path="/study-notes"
                    element={<StudyNotes />}
                />

                {/* Quiz */}
                <Route
                    path="/quiz/:id"
                    element={<Quiz />}
                />

                {/* Result */}
                <Route
                    path="/result/:id"
                    element={<Result />}
                />

                {/* History */}
                <Route
                    path="/history"
                    element={<History />}
                />

                {/* Profile */}
                <Route
                    path="/profile"
                    element={<Profile />}
                />

                {/* Unknown URL */}
                <Route
                    path="*"
                    element={<Navigate to="/login" replace />}
                />
            </Routes>
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}

export default App;