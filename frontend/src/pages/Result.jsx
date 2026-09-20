import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import "../styles/Result.css";

function Result() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ======================================================
    // FETCH RESULT
    // ======================================================

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const token = localStorage.getItem("token");

                // ------------------------------------------
                // CHECK LOGIN
                // ------------------------------------------

                if (!token) {
                    navigate("/login");
                    return;
                }

                // ------------------------------------------
                // FETCH RESULT
                // ------------------------------------------

                const response = await API.get(
                    `/quizzes/results/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                console.log("Result:", response.data);

                setResult(
                    response.data.result ||
                    response.data
                );
            } catch (error) {
                console.error("Error fetching result:", error);

                if (error.response?.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");

                    navigate("/login");
                    return;
                }

                setError(
                    error.response?.data?.message ||
                    "Failed to load result."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchResult();
    }, [id, navigate]);

    // ======================================================
    // LOADING
    // ======================================================

    if (loading) {
        return (
            <div className="result-loading">
                <div className="result-spinner"></div>

                <h2>
                    Loading your result...
                </h2>

                <p>
                    Calculating your performance
                </p>
            </div>
        );
    }

    // ======================================================
    // ERROR
    // ======================================================

    if (error) {
        return (
            <div className="result-error-page">
                <div className="result-error-card">
                    <div className="result-error-icon">
                        ⚠️
                    </div>

                    <h2>
                        Something went wrong
                    </h2>

                    <p>
                        {error}
                    </p>

                    <Link to="/">
                        <button>
                            Back to Home
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    // ======================================================
    // RESULT NOT FOUND
    // ======================================================

    if (!result) {
        return (
            <div className="result-error-page">
                <div className="result-error-card">
                    <div className="result-error-icon">
                        🔍
                    </div>

                    <h2>
                        Result Not Found
                    </h2>

                    <p>
                        We couldn't find the result you're looking for.
                    </p>

                    <Link to="/">
                        <button>
                            Back to Home
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    // ======================================================
    // SCORE
    // ======================================================

    const score = Number(result.score) || 0;

    const totalQuestions =
        Number(result.totalQuestions) || 0;

    const percentage =
        Number(result.percentage) || 0;

    const wrongAnswers = Math.max(
        0,
        totalQuestions - score
    );

    // ======================================================
    // PERFORMANCE
    // ======================================================

    let performanceMessage = "";
    let performanceEmoji = "";

    if (percentage >= 80) {
        performanceMessage =
            "Excellent work! You really know your stuff.";

        performanceEmoji = "🏆";
    } else if (percentage >= 60) {
        performanceMessage =
            "Good job! Keep practicing to improve further.";

        performanceEmoji = "🎉";
    } else if (percentage >= 40) {
        performanceMessage =
            "Not bad! A little more practice will help.";

        performanceEmoji = "💪";
    } else {
        performanceMessage =
            "Keep learning! Every attempt makes you better.";

        performanceEmoji = "📚";
    }

    // ======================================================
    // UI
    // ======================================================

    return (
        <div className="result-page">
            <div className="result-background">
                <div className="result-glow result-glow-one"></div>

                <div className="result-glow result-glow-two"></div>
            </div>

            <div className="result-container">
                {/* HEADER */}

                <div className="result-header">
                    <div className="result-badge">
                        ✨ Quiz Completed
                    </div>

                    <h1>
                        {performanceEmoji} Great Job!
                    </h1>

                    <p>
                        You've completed your{" "}
                        <strong>
                            {result.topic}
                        </strong>{" "}
                        quiz.
                    </p>
                </div>

                {/* SCORE CARD */}

                <div className="score-card">
                    <div className="score-circle">
                        <svg
                            className="score-ring"
                            viewBox="0 0 120 120"
                        >
                            <circle
                                className="score-ring-background"
                                cx="60"
                                cy="60"
                                r="52"
                            />

                            <circle
                                className="score-ring-progress"
                                cx="60"
                                cy="60"
                                r="52"
                                style={{
                                    strokeDashoffset:
                                        327 -
                                        (327 * percentage) / 100
                                }}
                            />
                        </svg>

                        <div className="score-circle-content">
                            <strong>
                                {percentage}%
                            </strong>

                            <span>
                                Score
                            </span>
                        </div>
                    </div>

                    <div className="score-details">
                        <h2>
                            {result.topic}
                        </h2>

                        <div className="difficulty-badge">
                            🎯 {result.difficulty}
                        </div>

                        <p>
                            {performanceMessage}
                        </p>
                    </div>
                </div>

                {/* RESULT STATISTICS */}

                <div className="result-stats">
                    <div className="result-stat-card correct">
                        <div className="stat-icon">
                            ✓
                        </div>

                        <div>
                            <strong>
                                {score}
                            </strong>

                            <span>
                                Correct Answers
                            </span>
                        </div>
                    </div>

                    <div className="result-stat-card wrong">
                        <div className="stat-icon">
                            ✕
                        </div>

                        <div>
                            <strong>
                                {wrongAnswers}
                            </strong>

                            <span>
                                Wrong Answers
                            </span>
                        </div>
                    </div>

                    <div className="result-stat-card total">
                        <div className="stat-icon">
                            📝
                        </div>

                        <div>
                            <strong>
                                {totalQuestions}
                            </strong>

                            <span>
                                Total Questions
                            </span>
                        </div>
                    </div>
                </div>

                {/* RESULT SUMMARY */}

                <div className="result-summary">
                    <div>
                        <span>
                            Quiz Topic
                        </span>

                        <strong>
                            {result.topic}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Difficulty
                        </span>

                        <strong>
                            {result.difficulty}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Final Score
                        </span>

                        <strong>
                            {score} / {totalQuestions}
                        </strong>
                    </div>
                </div>

                {/* ACTION BUTTONS */}

                <div className="result-actions">
                    <Link
                        to="/"
                        className="result-secondary-button"
                    >
                        ← Back to Home
                    </Link>

                    <Link
                        to="/history"
                        className="result-primary-button"
                    >
                        View History →
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Result;