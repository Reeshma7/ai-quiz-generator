import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/Dashboard.css";

function Dashboard() {
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalQuizzes: 0,
        averageScore: 0,
        bestScore: 0,
        quizzesToday: 0
    });

    const [weakAreas, setWeakAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // ==========================================
                // GET TOKEN
                // ==========================================

                const token = localStorage.getItem("token");

                if (!token) {
                    navigate("/login");
                    return;
                }

                // ==========================================
                // AUTHORIZATION HEADER
                // ==========================================

                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                };

                console.log("Dashboard token exists:", !!token);

                // ==========================================
                // FETCH DASHBOARD DATA
                // ==========================================

                const [statsResponse, weakAreasResponse] =
                    await Promise.all([
                        API.get("/quizzes/dashboard/stats", config),

                        API.get("/quizzes/dashboard/weak-areas", config)
                    ]);

                console.log(
                    "Dashboard stats:",
                    statsResponse.data
                );

                console.log(
                    "Weak areas:",
                    weakAreasResponse.data
                );

                // ==========================================
                // SET DATA
                // ==========================================

                setStats({
                    totalQuizzes:
                        statsResponse.data.totalQuizzes || 0,

                    averageScore:
                        statsResponse.data.averageScore || 0,

                    bestScore:
                        statsResponse.data.bestScore || 0,

                    quizzesToday:
                        statsResponse.data.quizzesToday || 0
                });

                setWeakAreas(
                    weakAreasResponse.data.weakAreas || []
                );

            } catch (error) {
                console.error(
                    "Dashboard data error:",
                    error
                );

                // ==========================================
                // TOKEN ERROR
                // ==========================================

                if (error.response?.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");

                    navigate("/login");
                    return;
                }

                setError(
                    error.response?.data?.message ||
                    "Failed to load dashboard."
                );

            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [navigate]);

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <div className="dashboard-loading">

                <div className="dashboard-spinner"></div>

                <h2>
                    Loading Dashboard...
                </h2>

                <p>
                    Analyzing your quiz performance
                </p>

            </div>
        );
    }

    // ==========================================
    // DASHBOARD ERROR
    // ==========================================

    if (error) {
        return (
            <div className="dashboard-loading">

                <h2>
                    Unable to Load Dashboard
                </h2>

                <p>
                    {error}
                </p>

                <button
                    onClick={() => window.location.reload()}
                >
                    Try Again
                </button>

            </div>
        );
    }

    return (
        <div className="dashboard-page">

            {/* =================================
                BACKGROUND
            ================================= */}

            <div className="dashboard-background">

                <div className="dashboard-glow dashboard-glow-one"></div>

                <div className="dashboard-glow dashboard-glow-two"></div>

            </div>

            <div className="dashboard-container">

                {/* =================================
                    HEADER
                ================================= */}

                <div className="dashboard-header">

                    <span className="dashboard-badge">
                        📊 YOUR PERFORMANCE
                    </span>

                    <h1>
                        Your Quiz{" "}
                        <span>Dashboard</span>
                    </h1>

                    <p>
                        Track your progress and discover
                        where you can improve.
                    </p>

                </div>

                {/* =================================
                    STATISTICS
                ================================= */}

                <div className="dashboard-stats">

                    {/* TOTAL QUIZZES */}

                    <div className="dashboard-stat-card">

                        <div className="dashboard-stat-icon purple">
                            📝
                        </div>

                        <div>

                            <strong>
                                {stats.totalQuizzes}
                            </strong>

                            <span>
                                Total Quizzes
                            </span>

                        </div>

                    </div>

                    {/* AVERAGE SCORE */}

                    <div className="dashboard-stat-card">

                        <div className="dashboard-stat-icon blue">
                            📈
                        </div>

                        <div>

                            <strong>
                                {stats.averageScore}%
                            </strong>

                            <span>
                                Average Score
                            </span>

                        </div>

                    </div>

                    {/* BEST SCORE */}

                    <div className="dashboard-stat-card">

                        <div className="dashboard-stat-icon green">
                            🏆
                        </div>

                        <div>

                            <strong>
                                {stats.bestScore}%
                            </strong>

                            <span>
                                Best Score
                            </span>

                        </div>

                    </div>

                    {/* QUIZZES TODAY */}

                    <div className="dashboard-stat-card">

                        <div className="dashboard-stat-icon orange">
                            🔥
                        </div>

                        <div>

                            <strong>
                                {stats.quizzesToday}
                            </strong>

                            <span>
                                Quizzes Today
                            </span>

                        </div>

                    </div>

                </div>

                {/* =================================
                    WEAK AREAS
                ================================= */}

                <div className="weak-area-section">

                    <div className="weak-area-header">

                        <div>

                            <h2>
                                🎯 Your Weak Areas
                            </h2>

                            <p>
                                Topics where you can improve
                                your performance.
                            </p>

                        </div>

                        <span className="weak-area-count">

                            {weakAreas.length}{" "}

                            {weakAreas.length === 1
                                ? "Topic"
                                : "Topics"}

                        </span>

                    </div>

                    {/* =================================
                        NO WEAK AREAS
                    ================================= */}

                    {weakAreas.length === 0 ? (

                        <div className="weak-area-empty">

                            <div className="weak-empty-icon">
                                🎉
                            </div>

                            <h3>
                                No Weak Areas!
                            </h3>

                            <p>
                                Great job! You don't currently
                                have any topics below 60%.
                            </p>

                            <Link
                                to="/generate"
                                className="practice-button"
                            >
                                Take Another Quiz →
                            </Link>

                        </div>

                    ) : (

                        /* =================================
                            WEAK AREA LIST
                        ================================= */

                        <div className="weak-area-list">

                            {weakAreas.map((area, index) => {

                                return (
                                    <div
                                        className="weak-area-card"
                                        key={area.topic}
                                    >

                                        <div className="weak-area-number">
                                            {index + 1}
                                        </div>

                                        <div className="weak-area-details">

                                            <div className="weak-area-title">

                                                <h3>
                                                    {area.topic}
                                                </h3>

                                                <span>
                                                    {area.attempts}{" "}

                                                    {area.attempts === 1
                                                        ? "attempt"
                                                        : "attempts"}
                                                </span>

                                            </div>

                                            <div className="weak-progress">

                                                <div
                                                    className="weak-progress-bar"
                                                    style={{
                                                        width: `${area.averageScore}%`
                                                    }}
                                                ></div>

                                            </div>

                                            <div className="weak-progress-info">

                                                <span>
                                                    Average performance
                                                </span>

                                                <strong>
                                                    {area.averageScore}%
                                                </strong>

                                            </div>

                                        </div>

                                        <Link
                                            to={`/generate?topic=${encodeURIComponent(
                                                area.topic
                                            )}`}
                                            className="weak-practice-button"
                                        >
                                            Practice
                                        </Link>

                                    </div>
                                );
                            })}

                        </div>
                    )}

                </div>

            </div>

        </div>
    );
}

export default Dashboard;