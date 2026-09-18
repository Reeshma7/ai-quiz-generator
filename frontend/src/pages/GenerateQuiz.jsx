import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/GenerateQuiz.css";

function GenerateQuiz() {
    const navigate = useNavigate();

    const [topic, setTopic] = useState("");
    const [difficulty, setDifficulty] = useState("Medium");
    const [numberOfQuestions, setNumberOfQuestions] = useState(5);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // ==========================================
    // GENERATE QUIZ
    // ==========================================

    const handleGenerateQuiz = async (e) => {
        e.preventDefault();

        setError("");

        // ==========================================
        // CHECK LOGIN
        // ==========================================

        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        // ==========================================
        // VALIDATE TOPIC
        // ==========================================

        if (!topic.trim()) {
            setError("Please enter a quiz topic.");
            return;
        }

        // ==========================================
        // VALIDATE TOPIC LENGTH
        // ==========================================

        if (topic.trim().length < 2) {
            setError("Topic must contain at least 2 characters.");
            return;
        }

        // ==========================================
        // START LOADING
        // ==========================================

        setLoading(true);

        try {
            // ==========================================
            // SEND REQUEST TO BACKEND
            // ==========================================

            const response = await axios.post(
                "http://localhost:5000/api/quizzes/generate",
                {
                    topic: topic.trim(),
                    difficulty: difficulty,
                    numberOfQuestions: Number(numberOfQuestions)
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log(
                "Generated Quiz:",
                response.data
            );

            // ==========================================
            // GET QUIZ ID
            // ==========================================

            const quizId = response.data.quiz?._id;

            if (!quizId) {
                setError(
                    "Quiz was generated, but quiz ID was not returned."
                );
                return;
            }

            // ==========================================
            // GO TO QUIZ PAGE
            // ==========================================

            navigate(`/quiz/${quizId}`);

        } catch (error) {
            console.error(
                "Quiz generation error:",
                error
            );

            // ==========================================
            // TOKEN EXPIRED / UNAUTHORIZED
            // ==========================================

            if (error.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");

                window.dispatchEvent(
                    new Event("authChange")
                );

                navigate("/login");

                return;
            }

            // ==========================================
            // SERVER ERROR MESSAGE
            // ==========================================

            setError(
                error.response?.data?.message ||
                "Failed to generate quiz. Please try again."
            );

        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // JSX
    // ==========================================

    return (
        <div className="generate-page">

            {/* =================================
                BACKGROUND
            ================================= */}

            <div className="generate-background">

                <div className="generate-glow generate-glow-one"></div>

                <div className="generate-glow generate-glow-two"></div>

            </div>


            {/* =================================
                MAIN CONTAINER
            ================================= */}

            <div className="generate-container">

                {/* =================================
                    HEADER
                ================================= */}

                <div className="generate-header">

                    <div className="generate-badge">
                        ✨ AI Quiz Builder
                    </div>

                    <h1>
                        Create Your
                        <span> AI Quiz</span>
                    </h1>

                    <p>
                        Choose a topic, select your difficulty,
                        and let AI create a personalized quiz for you.
                    </p>

                </div>


                {/* =================================
                    FORM CARD
                ================================= */}

                <form
                    className="generate-card"
                    onSubmit={handleGenerateQuiz}
                >

                    {/* =================================
                        TOPIC
                    ================================= */}

                    <div className="form-group">

                        <label htmlFor="topic">
                            📚 Quiz Topic
                        </label>

                        <input
                            id="topic"
                            type="text"
                            placeholder="Example: JavaScript, Python, DBMS..."
                            value={topic}
                            onChange={(e) =>
                                setTopic(e.target.value)
                            }
                            disabled={loading}
                        />

                        <small>
                            Enter any subject you want to practice.
                        </small>

                    </div>


                    {/* =================================
                        DIFFICULTY
                    ================================= */}

                    <div className="form-group">

                        <label>
                            🎯 Difficulty Level
                        </label>

                        <div className="difficulty-options">

                            {/* EASY */}

                            <button
                                type="button"
                                className={
                                    difficulty === "Easy"
                                        ? "difficulty-option active easy"
                                        : "difficulty-option"
                                }
                                onClick={() =>
                                    setDifficulty("Easy")
                                }
                                disabled={loading}
                            >
                                <span>🌱</span>

                                <strong>
                                    Easy
                                </strong>

                                <small>
                                    Beginner
                                </small>
                            </button>


                            {/* MEDIUM */}

                            <button
                                type="button"
                                className={
                                    difficulty === "Medium"
                                        ? "difficulty-option active medium"
                                        : "difficulty-option"
                                }
                                onClick={() =>
                                    setDifficulty("Medium")
                                }
                                disabled={loading}
                            >
                                <span>⚡</span>

                                <strong>
                                    Medium
                                </strong>

                                <small>
                                    Intermediate
                                </small>
                            </button>


                            {/* HARD */}

                            <button
                                type="button"
                                className={
                                    difficulty === "Hard"
                                        ? "difficulty-option active hard"
                                        : "difficulty-option"
                                }
                                onClick={() =>
                                    setDifficulty("Hard")
                                }
                                disabled={loading}
                            >
                                <span>🔥</span>

                                <strong>
                                    Hard
                                </strong>

                                <small>
                                    Advanced
                                </small>
                            </button>

                        </div>

                    </div>


                    {/* =================================
                        NUMBER OF QUESTIONS
                    ================================= */}

                    <div className="form-group">

                        <div className="question-label-row">

                            <label htmlFor="numberOfQuestions">
                                📝 Number of Questions
                            </label>

                            <span className="question-count">
                                {numberOfQuestions}
                            </span>

                        </div>

                        <input
                            id="numberOfQuestions"
                            className="question-range"
                            type="range"
                            min="1"
                            max="20"
                            value={numberOfQuestions}
                            onChange={(e) =>
                                setNumberOfQuestions(
                                    Number(e.target.value)
                                )
                            }
                            disabled={loading}
                        />

                        <div className="range-labels">

                            <span>
                                1
                            </span>

                            <span>
                                20
                            </span>

                        </div>

                    </div>


                    {/* =================================
                        ERROR
                    ================================= */}

                    {error && (
                        <div className="generate-error">
                            ⚠️ {error}
                        </div>
                    )}


                    {/* =================================
                        SUBMIT BUTTON
                    ================================= */}

                    <button
                        type="submit"
                        className="generate-submit"
                        disabled={loading}
                    >

                        {loading ? (
                            <>
                                <span className="loading-spinner"></span>

                                Generating Quiz...
                            </>
                        ) : (
                            <>
                                Generate Quiz

                                <span>
                                    →
                                </span>
                            </>
                        )}

                    </button>


                    {/* =================================
                        NOTE
                    ================================= */}

                    <p className="generate-note">
                        🤖 Your quiz will be generated using AI
                    </p>

                </form>

            </div>

        </div>
    );
}

export default GenerateQuiz;