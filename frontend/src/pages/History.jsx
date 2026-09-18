import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../styles/History.css";

function History() {

    const navigate = useNavigate();

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {

        const fetchHistory = async () => {

            try {

                const token =
                    localStorage.getItem("token");


                // ------------------------------------------
                // CHECK LOGIN
                // ------------------------------------------

                if (!token) {

                    navigate("/login");
                    return;

                }


                // ------------------------------------------
                // REQUEST
                // ------------------------------------------

                const response =
                    await axios.get(

                        "http://localhost:5000/api/quizzes/results",

                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            }
                        }

                    );


                console.log(
                    "History:",
                    response.data
                );


                setResults(
                    response.data.results ||
                    []
                );

            } catch (error) {

                console.error(
                    "History error:",
                    error
                );


                if (
                    error.response?.status === 401
                ) {

                    localStorage.removeItem("token");
                    localStorage.removeItem("user");

                    navigate("/login");

                    return;
                }


                setError(
                    error.response?.data?.message ||
                    "Failed to load quiz history."
                );

            } finally {

                setLoading(false);

            }
        };


        fetchHistory();

    }, [navigate]);


    // ======================================================
    // LOADING
    // ======================================================

    if (loading) {

        return (
            <div className="history-loading">

                <div className="history-spinner"></div>

                <h2>
                    Loading your history...
                </h2>

                <p>
                    Fetching your quiz results
                </p>

            </div>
        );
    }


    // ======================================================
    // ERROR
    // ======================================================

    if (error) {

        return (
            <div className="history-error-page">

                <div className="history-error-card">

                    <div className="history-error-icon">
                        ⚠️
                    </div>

                    <h2>
                        Unable to Load History
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        onClick={() =>
                            window.location.reload()
                        }
                    >
                        Try Again
                    </button>

                </div>

            </div>
        );
    }


    // ======================================================
    // STATISTICS
    // ======================================================

    const totalQuizzes =
        results.length;


    const totalQuestions =
        results.reduce(
            (total, result) =>
                total +
                Number(
                    result.totalQuestions || 0
                ),
            0
        );


    const totalCorrect =
        results.reduce(
            (total, result) =>
                total +
                Number(
                    result.score || 0
                ),
            0
        );


    const averagePercentage =
        totalQuizzes > 0
            ? Math.round(
                results.reduce(
                    (total, result) =>
                        total +
                        Number(
                            result.percentage || 0
                        ),
                    0
                ) / totalQuizzes
            )
            : 0;


    // ======================================================
    // UI
    // ======================================================

    return (

        <div className="history-page">

            <div className="history-background">

                <div className="history-glow history-glow-one"></div>

                <div className="history-glow history-glow-two"></div>

            </div>


            <div className="history-container">


                <div className="history-header">

                    <div className="history-badge">
                        📊 Your Progress
                    </div>

                    <h1>
                        Quiz <span>History</span>
                    </h1>

                    <p>
                        Review your previous quizzes and
                        track your learning progress.
                    </p>

                </div>


                <div className="history-stats">

                    <div className="history-stat-card">

                        <div className="history-stat-icon purple">
                            📝
                        </div>

                        <div>
                            <strong>
                                {totalQuizzes}
                            </strong>

                            <span>
                                Quizzes Taken
                            </span>
                        </div>

                    </div>


                    <div className="history-stat-card">

                        <div className="history-stat-icon blue">
                            📚
                        </div>

                        <div>
                            <strong>
                                {totalQuestions}
                            </strong>

                            <span>
                                Questions Answered
                            </span>
                        </div>

                    </div>


                    <div className="history-stat-card">

                        <div className="history-stat-icon green">
                            ✓
                        </div>

                        <div>
                            <strong>
                                {totalCorrect}
                            </strong>

                            <span>
                                Correct Answers
                            </span>
                        </div>

                    </div>


                    <div className="history-stat-card">

                        <div className="history-stat-icon orange">
                            🎯
                        </div>

                        <div>
                            <strong>
                                {averagePercentage}%
                            </strong>

                            <span>
                                Average Score
                            </span>
                        </div>

                    </div>

                </div>


                {results.length === 0 ? (

                    <div className="history-empty">

                        <div className="empty-icon">
                            📚
                        </div>

                        <h2>
                            No Quiz History Yet
                        </h2>

                        <p>
                            You haven't completed any quizzes yet.
                            Generate your first quiz and start
                            learning!
                        </p>

                        <Link
                            to="/generate"
                            className="history-start-button"
                        >
                            Create Your First Quiz →
                        </Link>

                    </div>

                ) : (

                    <div className="history-results">

                        <div className="history-results-header">

                            <div>

                                <h2>
                                    Recent Quizzes
                                </h2>

                                <p>
                                    Your completed quiz attempts
                                </p>

                            </div>

                            <span>
                                {results.length}{" "}
                                {results.length === 1
                                    ? "Result"
                                    : "Results"}
                            </span>

                        </div>


                        <div className="history-list">

                            {results.map(
                                (result, index) => {

                                    const percentage =
                                        Number(
                                            result.percentage
                                        ) || 0;


                                    let scoreClass =
                                        "low";


                                    if (
                                        percentage >= 80
                                    ) {

                                        scoreClass =
                                            "excellent";

                                    } else if (
                                        percentage >= 60
                                    ) {

                                        scoreClass =
                                            "good";

                                    } else if (
                                        percentage >= 40
                                    ) {

                                        scoreClass =
                                            "average";

                                    }


                                    return (

                                        <div
                                            className="history-card"
                                            key={result._id}
                                        >

                                            <div className="history-number">
                                                {String(
                                                    index + 1
                                                ).padStart(
                                                    2,
                                                    "0"
                                                )}
                                            </div>


                                            <div className="history-details">

                                                <h3>
                                                    {result.topic}
                                                </h3>

                                                <div className="history-meta">

                                                    <span>
                                                        🎯{" "}
                                                        {result.difficulty}
                                                    </span>

                                                    <span>
                                                        📝{" "}
                                                        {
                                                            result.totalQuestions
                                                        }{" "}
                                                        Questions
                                                    </span>

                                                </div>

                                            </div>


                                            <div
                                                className={`history-score ${scoreClass}`}
                                            >

                                                <strong>
                                                    {percentage}%
                                                </strong>

                                                <span>
                                                    {result.score}/
                                                    {
                                                        result.totalQuestions
                                                    }
                                                </span>

                                            </div>


                                            <div
                                                className={`history-status ${scoreClass}`}
                                            >

                                                {percentage >= 80
                                                    ? "Excellent"
                                                    : percentage >= 60
                                                    ? "Good"
                                                    : percentage >= 40
                                                    ? "Average"
                                                    : "Keep Practicing"}

                                            </div>

                                        </div>

                                    );

                                }
                            )}

                        </div>

                    </div>

                )}

            </div>

        </div>
    );
}

export default History;