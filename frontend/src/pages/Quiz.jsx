import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../styles/Quiz.css";

function Quiz() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [finalizedAnswers, setFinalizedAnswers] = useState({});
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Drag & Drop
    const [draggedOption, setDraggedOption] = useState("");
    const [isDragOver, setIsDragOver] = useState(false);

    // AI Hint
    const [hint, setHint] = useState("");
    const [hintLoading, setHintLoading] = useState(false);
    const [hintLevel, setHintLevel] = useState(0);

    // Timer
    const [timeLeft, setTimeLeft] = useState(0);

    const submittedRef = useRef(false);
    const answersRef = useRef({});

    // ======================================================
    // FETCH QUIZ
    // ======================================================

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const response = await axios.get(
                    `http://localhost:5000/api/quizzes/${id}`
                );

                console.log("Quiz:", response.data);

                const quizData =
                    response.data.quiz ||
                    response.data;

                setQuiz(quizData);
            } catch (error) {
                console.error(
                    "Error fetching quiz:",
                    error
                );

                setError(
                    error.response?.data?.message ||
                    "Failed to load quiz."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchQuiz();
    }, [id]);

    // ======================================================
    // KEEP ANSWER REF UPDATED
    // ======================================================

    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    // ======================================================
    // TIMER - 30 SECONDS PER QUESTION
    // ======================================================

    useEffect(() => {
        if (!quiz || !quiz.questions) {
            return;
        }

        const totalQuestions =
            quiz.questions.length;

        const totalSeconds =
            totalQuestions * 30;

        const timerKey =
            `quiz_end_time_${id}`;

        let endTime =
            localStorage.getItem(timerKey);

        if (!endTime) {
            endTime =
                Date.now() +
                totalSeconds * 1000;

            localStorage.setItem(
                timerKey,
                endTime
            );
        } else {
            endTime = Number(endTime);
        }

        const calculateRemainingTime = () => {
            const remaining =
                Math.max(
                    0,
                    Math.ceil(
                        (Number(endTime) -
                            Date.now()) /
                        1000
                    )
                );

            setTimeLeft(remaining);

            return remaining;
        };

        calculateRemainingTime();

        const timer = setInterval(() => {
            const remaining =
                calculateRemainingTime();

            if (
                remaining <= 0 &&
                !submittedRef.current
            ) {
                clearInterval(timer);

                submittedRef.current = true;

                autoSubmitQuiz();
            }
        }, 1000);

        return () => {
            clearInterval(timer);
        };
    }, [quiz, id]);

    // ======================================================
    // AUTO SUBMIT
    // ======================================================

    const autoSubmitQuiz = async () => {
        if (submitting) {
            return;
        }

        const token =
            localStorage.getItem("token");

        if (!token) {
            setError(
                "Please login before submitting the quiz."
            );

            submittedRef.current = false;

            setTimeout(() => {
                navigate("/login");
            }, 1000);

            return;
        }

        try {
            setSubmitting(true);
            setError("");

            const answerArray =
                quiz.questions.map(
                    (_, index) =>
                        answersRef.current[index] || ""
                );

            console.log(
                "Auto submitting answers:",
                answerArray
            );

            const response =
                await axios.post(
                    `http://localhost:5000/api/quizzes/${id}/submit`,
                    {
                        answers: answerArray
                    },
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                            "Content-Type":
                                "application/json"
                        }
                    }
                );

            const result =
                response.data.result;

            localStorage.removeItem(
                `quiz_end_time_${id}`
            );

            if (!result || !result._id) {
                setError(
                    "Quiz submitted, but result ID was not returned."
                );

                submittedRef.current = false;

                return;
            }

            alert(
                "⏰ Time is over! Your quiz has been automatically submitted."
            );

            navigate(
                `/result/${result._id}`
            );
        } catch (error) {
            console.error(
                "Auto submit error:",
                error
            );

            submittedRef.current = false;

            if (
                error.response?.status === 401
            ) {
                localStorage.removeItem(
                    "token"
                );

                localStorage.removeItem(
                    "user"
                );

                setError(
                    "Your login session has expired. Please login again."
                );

                setTimeout(() => {
                    navigate("/login");
                }, 1000);

                return;
            }

            setError(
                error.response?.data?.message ||
                "Failed to automatically submit quiz."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // ======================================================
    // AI HINT
    // ======================================================

    const handleGetHint = async () => {
        if (
            hintLoading ||
            submittedRef.current ||
            isAnswered
        ) {
            return;
        }

        const token =
            localStorage.getItem("token");

        if (!token) {
            setError(
                "Please login to use the AI Hint."
            );

            return;
        }

        const nextHintLevel =
            hintLevel === 0
                ? 1
                : hintLevel + 1;

        if (nextHintLevel > 3) {
            return;
        }

        try {
            setHintLoading(true);
            setError("");

            const response =
                await axios.post(
                    "http://localhost:5000/api/quizzes/hint",
                    {
                        question:
                            question.question,
                        options:
                            question.options || [],
                        difficulty:
                            quiz.difficulty,
                        hintLevel:
                            nextHintLevel
                    },
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                            "Content-Type":
                                "application/json"
                        }
                    }
                );

            const generatedHint =
                response.data.hint;

            if (!generatedHint) {
                throw new Error(
                    "No hint was returned by the AI."
                );
            }

            setHint(generatedHint);
            setHintLevel(nextHintLevel);
        } catch (error) {
            console.error(
                "AI hint error:",
                error
            );

            if (
                error.response?.status === 401
            ) {
                localStorage.removeItem(
                    "token"
                );

                localStorage.removeItem(
                    "user"
                );

                setError(
                    "Your login session has expired. Please login again."
                );

                setTimeout(() => {
                    navigate("/login");
                }, 1000);

                return;
            }

            setError(
                error.response?.data?.message ||
                "Failed to generate AI hint."
            );
        } finally {
            setHintLoading(false);
        }
    };

    // ======================================================
    // RESET HINT
    // ======================================================

    const resetHint = () => {
        setHint("");
        setHintLevel(0);
        setHintLoading(false);
    };

    // ======================================================
    // MCQ / DRAG & DROP ANSWER
    // ======================================================

    const handleSelectAnswer = (
        questionIndex,
        answer
    ) => {
        if (
            submittedRef.current ||
            finalizedAnswers[questionIndex]
        ) {
            return;
        }

        const updatedAnswers = {
            ...answers,
            [questionIndex]: answer
        };

        setAnswers(updatedAnswers);

        answersRef.current =
            updatedAnswers;

        setFinalizedAnswers(
            (previous) => ({
                ...previous,
                [questionIndex]: true
            })
        );

        setDraggedOption("");
        setIsDragOver(false);
        setError("");
    };

    // ======================================================
    // DRAG START
    // ======================================================

    const handleDragStart = (
        e,
        option
    ) => {
        if (
            finalizedAnswers[currentQuestion] ||
            submitting
        ) {
            return;
        }

        setDraggedOption(option);

        e.dataTransfer.effectAllowed =
            "move";

        e.dataTransfer.setData(
            "text/plain",
            option
        );
    };

    // ======================================================
    // DRAG OVER
    // ======================================================

    const handleDragOver = (e) => {
        e.preventDefault();

        e.dataTransfer.dropEffect =
            "move";

        if (
            !finalizedAnswers[currentQuestion]
        ) {
            setIsDragOver(true);
        }
    };

    // ======================================================
    // DRAG LEAVE
    // ======================================================

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    // ======================================================
    // DROP ANSWER
    // ======================================================

    const handleDrop = (
        e,
        questionIndex
    ) => {
        e.preventDefault();

        if (
            finalizedAnswers[questionIndex] ||
            submitting
        ) {
            return;
        }

        const droppedOption =
            e.dataTransfer.getData(
                "text/plain"
            );

        if (droppedOption) {
            handleSelectAnswer(
                questionIndex,
                droppedOption
            );
        }

        setDraggedOption("");
        setIsDragOver(false);
    };

    // ======================================================
    // FILL IN THE BLANK INPUT
    // ======================================================

    const handleFillInput = (
        questionIndex,
        value
    ) => {
        if (
            submittedRef.current ||
            finalizedAnswers[questionIndex]
        ) {
            return;
        }

        const updatedAnswers = {
            ...answers,
            [questionIndex]: value
        };

        setAnswers(updatedAnswers);

        answersRef.current =
            updatedAnswers;
    };

    // ======================================================
    // FINALIZE FILL BLANK ANSWER
    // ======================================================

    const handleFillBlankSubmit = () => {
        const answer =
            answers[currentQuestion];

        if (
            !answer ||
            !answer.trim()
        ) {
            setError(
                "Please enter an answer before continuing."
            );

            return;
        }

        setFinalizedAnswers(
            (previous) => ({
                ...previous,
                [currentQuestion]: true
            })
        );

        setError("");
    };

    // ======================================================
    // ANSWER CHECK
    // ======================================================

    const checkAnswer = (
        question,
        userAnswer
    ) => {
        if (
            !userAnswer ||
            !question.correctAnswer
        ) {
            return false;
        }

        if (
            question.type ===
            "fill_blank"
        ) {
            return (
                userAnswer
                    .toString()
                    .trim()
                    .toLowerCase() ===
                question.correctAnswer
                    .toString()
                    .trim()
                    .toLowerCase()
            );
        }

        return (
            userAnswer
                .toString()
                .trim() ===
            question.correctAnswer
                .toString()
                .trim()
        );
    };

    // ======================================================
    // NEXT QUESTION
    // ======================================================

    const handleNextQuestion = () => {
        if (
            currentQuestion <
            quiz.questions.length - 1
        ) {
            setCurrentQuestion(
                (previous) =>
                    previous + 1
            );

            setDraggedOption("");
            setIsDragOver(false);
            setError("");
            resetHint();

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }
    };

    // ======================================================
    // PREVIOUS QUESTION
    // ======================================================

    const handlePreviousQuestion = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(
                (previous) =>
                    previous - 1
            );

            setDraggedOption("");
            setIsDragOver(false);
            setError("");
            resetHint();

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }
    };

    // ======================================================
    // MANUAL SUBMIT
    // ======================================================

    const handleSubmit = async () => {
        if (submittedRef.current) {
            return;
        }

        const token =
            localStorage.getItem("token");

        if (!token) {
            setError(
                "Please login before submitting the quiz."
            );

            setTimeout(() => {
                navigate("/login");
            }, 1000);

            return;
        }

        if (
            Object.keys(finalizedAnswers).length <
            quiz.questions.length
        ) {
            setError(
                "Please answer all questions before submitting the quiz."
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

            return;
        }

        submittedRef.current = true;

        setSubmitting(true);
        setError("");

        try {
            const answerArray =
                quiz.questions.map(
                    (_, index) =>
                        answers[index] || ""
                );

            console.log(
                "Answers:",
                answerArray
            );

            const response =
                await axios.post(
                    `http://localhost:5000/api/quizzes/${id}/submit`,
                    {
                        answers: answerArray
                    },
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                            "Content-Type":
                                "application/json"
                        }
                    }
                );

            console.log(
                "Quiz submitted:",
                response.data
            );

            const result =
                response.data.result;

            localStorage.removeItem(
                `quiz_end_time_${id}`
            );

            if (
                !result ||
                !result._id
            ) {
                setError(
                    "Quiz submitted, but result ID was not returned."
                );

                submittedRef.current =
                    false;

                return;
            }

            navigate(
                `/result/${result._id}`
            );
        } catch (error) {
            console.error(
                "Submit error:",
                error
            );

            submittedRef.current =
                false;

            if (
                error.response?.status === 401
            ) {
                localStorage.removeItem(
                    "token"
                );

                localStorage.removeItem(
                    "user"
                );

                setError(
                    "Your login session has expired. Please login again."
                );

                setTimeout(() => {
                    navigate("/login");
                }, 1000);

                return;
            }

            setError(
                error.response?.data?.message ||
                "Failed to submit quiz."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // ======================================================
    // FORMAT TIMER
    // ======================================================

    const formatTime = (seconds) => {
        const minutes =
            Math.floor(seconds / 60);

        const remainingSeconds =
            seconds % 60;

        return (
            `${String(minutes).padStart(
                2,
                "0"
            )}:` +
            `${String(
                remainingSeconds
            ).padStart(2, "0")}`
        );
    };

    // ======================================================
    // TIMER CLASS
    // ======================================================

    const getTimerClass = () => {
        if (timeLeft <= 30) {
            return "quiz-timer danger";
        }

        if (timeLeft <= 60) {
            return "quiz-timer warning";
        }

        return "quiz-timer";
    };

    // ======================================================
    // QUESTION TYPE NAME
    // ======================================================

    const getQuestionTypeName = (
        type
    ) => {
        if (
            type === "fill_blank"
        ) {
            return "✏️ Fill in the Blank";
        }

        if (
            type === "drag_drop"
        ) {
            return "↔️ Drag & Drop";
        }

        if (
            type === "dropdown"
        ) {
            return "🔽 Dropdown";
        }

        return "🔘 Multiple Choice";
    };

    // ======================================================
    // LOADING
    // ======================================================

    if (loading) {
        return (
            <div className="quiz-loading">
                <div className="quiz-spinner"></div>

                <h2>
                    Loading your quiz...
                </h2>

                <p>
                    Preparing your questions
                </p>
            </div>
        );
    }

    // ======================================================
    // ERROR
    // ======================================================

    if (error && !quiz) {
        return (
            <div className="quiz-error-page">
                <div className="quiz-error-card">
                    <div className="error-icon">
                        ⚠️
                    </div>

                    <h2>
                        Something went wrong
                    </h2>

                    <p>{error}</p>

                    <button
                        onClick={() =>
                            navigate("/")
                        }
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    // ======================================================
    // QUIZ NOT FOUND
    // ======================================================

    if (!quiz) {
        return (
            <div className="quiz-error-page">
                <div className="quiz-error-card">
                    <div className="error-icon">
                        🔍
                    </div>

                    <h2>
                        Quiz Not Found
                    </h2>

                    <p>
                        The quiz you're looking
                        for doesn't exist.
                    </p>

                    <button
                        onClick={() =>
                            navigate("/")
                        }
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    // ======================================================
    // VARIABLES
    // ======================================================

    const totalQuestions =
        quiz.questions?.length || 0;

    const question =
        quiz.questions[
            currentQuestion
        ];

    const questionType =
        question.type || "mcq";

    const selectedAnswer =
        answers[currentQuestion] || "";

    const isAnswered =
        Boolean(
            finalizedAnswers[
                currentQuestion
            ]
        );

    const isCorrect =
        isAnswered
            ? checkAnswer(
                question,
                selectedAnswer
            )
            : false;

    const answeredCount =
        Object.keys(
            finalizedAnswers
        ).length;

    const progress =
        totalQuestions > 0
            ? (
                answeredCount /
                totalQuestions
            ) * 100
            : 0;

    // ======================================================
    // UI
    // ======================================================

    return (
        <div className="quiz-page">
            <div className="quiz-background">
                <div className="quiz-glow quiz-glow-one"></div>

                <div className="quiz-glow quiz-glow-two"></div>
            </div>

            <div className="quiz-container">
                {/* HEADER */}

                <div className="quiz-header">
                    <div className="quiz-badge">
                        🧠 AI Generated Quiz
                    </div>

                    <h1>
                        {quiz.topic} Quiz
                    </h1>

                    <p>
                        Test your knowledge and
                        learn from every answer.
                    </p>

                    <div className="quiz-info">
                        <div className="quiz-info-item">
                            <span>🎯</span>

                            <div>
                                <small>
                                    Difficulty
                                </small>

                                <strong>
                                    {quiz.difficulty}
                                </strong>
                            </div>
                        </div>

                        <div className="quiz-info-item">
                            <span>📝</span>

                            <div>
                                <small>
                                    Question
                                </small>

                                <strong>
                                    {currentQuestion +
                                        1}
                                    /
                                    {totalQuestions}
                                </strong>
                            </div>
                        </div>

                        <div className="quiz-info-item">
                            <span>✅</span>

                            <div>
                                <small>
                                    Answered
                                </small>

                                <strong>
                                    {answeredCount}/
                                    {totalQuestions}
                                </strong>
                            </div>
                        </div>

                        <div
                            className={
                                getTimerClass()
                            }
                        >
                            <span className="timer-icon">
                                ⏱️
                            </span>

                            <div>
                                <small>
                                    Time Left
                                </small>

                                <strong>
                                    {formatTime(
                                        timeLeft
                                    )}
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TIMER WARNING */}

                {timeLeft <= 60 &&
                    timeLeft > 0 && (
                        <div className="timer-warning-message">
                            {timeLeft <= 30
                                ? "🚨 Hurry! Only a few seconds left!"
                                : "⚠️ Less than one minute remaining!"}
                        </div>
                    )}

                {/* PROGRESS */}

                <div className="quiz-progress-card">
                    <div className="progress-top">
                        <span>
                            Your Progress
                        </span>

                        <strong>
                            {answeredCount}/
                            {totalQuestions}
                        </strong>
                    </div>

                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{
                                width:
                                    `${progress}%`
                            }}
                        />
                    </div>
                </div>

                {/* ERROR */}

                {error && (
                    <div className="quiz-warning">
                        ⚠️ {error}
                    </div>
                )}

                {/* QUESTION */}

                <div className="questions-container">
                    <div className="question-card">
                        {/* QUESTION TOP */}

                        <div className="question-top-row">
                            <div className="question-number">
                                Question{" "}
                                {currentQuestion +
                                    1}
                            </div>

                            <div className="question-type-badge">
                                {getQuestionTypeName(
                                    questionType
                                )}
                            </div>
                        </div>

                        {/* QUESTION TEXT */}

                        <h2>
                            {question.question}
                        </h2>

                        {/* AI HINT */}

                        {!isAnswered && (
                            <div className="ai-hint-section">
                                <button
                                    type="button"
                                    className="ai-hint-button"
                                    onClick={
                                        handleGetHint
                                    }
                                    disabled={
                                        hintLoading ||
                                        submitting ||
                                        hintLevel >=
                                            3
                                    }
                                >
                                    {hintLoading
                                        ? "🤖 Generating Hint..."
                                        : hintLevel ===
                                            0
                                            ? "💡 Get AI Hint"
                                            : hintLevel ===
                                                1
                                                ? "💡 Get Stronger Hint"
                                                : hintLevel ===
                                                    2
                                                    ? "💡 Get Final Hint"
                                                    : "✅ All Hints Used"}
                                </button>

                                {hint && (
                                    <div className="ai-hint-box">
                                        <div className="ai-hint-header">
                                            <span>
                                                🤖 AI Hint
                                            </span>

                                            <span>
                                                Level{" "}
                                                {
                                                    hintLevel
                                                }
                                                /3
                                            </span>
                                        </div>

                                        <p>
                                            {hint}
                                        </p>

                                        {hintLevel <
                                            3 && (
                                            <small>
                                                Need more
                                                help? You
                                                can request
                                                a stronger
                                                hint.
                                            </small>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* MCQ */}

                        {questionType ===
                            "mcq" && (
                            <div className="options-container">
                                {question.options?.map(
                                    (
                                        option,
                                        optionIndex
                                    ) => {
                                        const isSelected =
                                            selectedAnswer ===
                                            option;

                                        const isCorrectOption =
                                            option ===
                                            question.correctAnswer;

                                        let optionClass =
                                            "option-card";

                                        if (
                                            isAnswered
                                        ) {
                                            if (
                                                isCorrectOption
                                            ) {
                                                optionClass +=
                                                    " correct";
                                            }

                                            if (
                                                isSelected &&
                                                !isCorrect
                                            ) {
                                                optionClass +=
                                                    " wrong";
                                            }
                                        } else if (
                                            isSelected
                                        ) {
                                            optionClass +=
                                                " selected";
                                        }

                                        return (
                                            <label
                                                key={
                                                    optionIndex
                                                }
                                                className={
                                                    optionClass
                                                }
                                            >
                                                <input
                                                    type="radio"
                                                    name={`question-${currentQuestion}`}
                                                    value={
                                                        option
                                                    }
                                                    checked={
                                                        isSelected
                                                    }
                                                    disabled={
                                                        isAnswered ||
                                                        submitting
                                                    }
                                                    onChange={() =>
                                                        handleSelectAnswer(
                                                            currentQuestion,
                                                            option
                                                        )
                                                    }
                                                />

                                                <span className="option-letter">
                                                    {String.fromCharCode(
                                                        65 +
                                                            optionIndex
                                                    )}
                                                </span>

                                                <span className="option-text">
                                                    {
                                                        option
                                                    }
                                                </span>

                                                {isAnswered &&
                                                    isCorrectOption && (
                                                        <span className="option-check">
                                                            ✓
                                                        </span>
                                                    )}

                                                {isAnswered &&
                                                    isSelected &&
                                                    !isCorrect && (
                                                        <span className="option-cross">
                                                            ✕
                                                        </span>
                                                    )}
                                            </label>
                                        );
                                    }
                                )}
                            </div>
                        )}

                        {/* DRAG & DROP */}

                        {questionType ===
                            "drag_drop" && (
                            <div className="drag-drop-container">
                                <div className="drag-drop-instructions">
                                    ↔️ Drag the correct
                                    option into the
                                    answer box

                                    <span>
                                        Or tap an option
                                        to select it
                                    </span>
                                </div>

                                <div className="drag-options">
                                    {question.options?.map(
                                        (
                                            option,
                                            optionIndex
                                        ) => {
                                            const isSelected =
                                                selectedAnswer ===
                                                option;

                                            let optionClass =
                                                "drag-option";

                                            if (
                                                draggedOption ===
                                                option
                                            ) {
                                                optionClass +=
                                                    " dragging";
                                            }

                                            if (
                                                isSelected
                                            ) {
                                                optionClass +=
                                                    " selected";
                                            }

                                            return (
                                                <div
                                                    key={
                                                        optionIndex
                                                    }
                                                    className={
                                                        optionClass
                                                    }
                                                    draggable={
                                                        !isAnswered &&
                                                        !submitting
                                                    }
                                                    onDragStart={(
                                                        e
                                                    ) =>
                                                        handleDragStart(
                                                            e,
                                                            option
                                                        )
                                                    }
                                                    onDragEnd={() => {
                                                        setDraggedOption(
                                                            ""
                                                        );

                                                        setIsDragOver(
                                                            false
                                                        );
                                                    }}
                                                    onClick={() => {
                                                        if (
                                                            !isAnswered &&
                                                            !submitting
                                                        ) {
                                                            handleSelectAnswer(
                                                                currentQuestion,
                                                                option
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <span className="drag-icon">
                                                        ⋮⋮
                                                    </span>

                                                    <span className="drag-option-number">
                                                        {optionIndex +
                                                            1}
                                                    </span>

                                                    <span className="drag-option-text">
                                                        {
                                                            option
                                                        }
                                                    </span>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>

                                <div
                                    className={`
                                        drop-zone
                                        ${
                                            isDragOver
                                                ? "drag-over"
                                                : ""
                                        }
                                        ${
                                            selectedAnswer
                                                ? "has-answer"
                                                : ""
                                        }
                                        ${
                                            isAnswered
                                                ? isCorrect
                                                    ? "correct"
                                                    : "wrong"
                                                : ""
                                        }
                                    `}
                                    onDragOver={
                                        handleDragOver
                                    }
                                    onDragLeave={
                                        handleDragLeave
                                    }
                                    onDrop={(e) =>
                                        handleDrop(
                                            e,
                                            currentQuestion
                                        )
                                    }
                                >
                                    {selectedAnswer ? (
                                        <div className="dropped-answer">
                                            <span className="drop-check">
                                                {isAnswered
                                                    ? isCorrect
                                                        ? "✓"
                                                        : "✕"
                                                    : "✓"}
                                            </span>

                                            <span>
                                                {
                                                    selectedAnswer
                                                }
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="drop-zone-placeholder">
                                            <span className="drop-zone-icon">
                                                ⬇️
                                            </span>

                                            <strong>
                                                Drop your
                                                answer here
                                            </strong>

                                            <small>
                                                Drag an
                                                option into
                                                this box
                                            </small>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* LEGACY DROPDOWN */}

                        {questionType ===
                            "dropdown" && (
                            <div className="dropdown-answer-container">
                                <label className="answer-label">
                                    🔽 Select your
                                    answer
                                </label>

                                <select
                                    className={
                                        isAnswered
                                            ? isCorrect
                                                ? "quiz-dropdown correct"
                                                : "quiz-dropdown wrong"
                                            : "quiz-dropdown"
                                    }
                                    value={
                                        selectedAnswer
                                    }
                                    disabled={
                                        isAnswered ||
                                        submitting
                                    }
                                    onChange={(e) => {
                                        if (
                                            e.target
                                                .value
                                        ) {
                                            handleSelectAnswer(
                                                currentQuestion,
                                                e.target
                                                    .value
                                            );
                                        }
                                    }}
                                >
                                    <option
                                        value=""
                                        disabled
                                    >
                                        -- Select an
                                        answer --
                                    </option>

                                    {question.options?.map(
                                        (
                                            option,
                                            optionIndex
                                        ) => (
                                            <option
                                                key={
                                                    optionIndex
                                                }
                                                value={
                                                    option
                                                }
                                            >
                                                {
                                                    option
                                                }
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>
                        )}

                        {/* FILL IN THE BLANK */}

                        {questionType ===
                            "fill_blank" && (
                            <div className="fill-blank-container">
                                <label className="answer-label">
                                    ✏️ Type the missing
                                    answer
                                </label>

                                <input
                                    type="text"
                                    className={
                                        isAnswered
                                            ? isCorrect
                                                ? "fill-blank-input correct"
                                                : "fill-blank-input wrong"
                                            : "fill-blank-input"
                                    }
                                    placeholder="Type your answer here..."
                                    value={
                                        selectedAnswer
                                    }
                                    disabled={
                                        isAnswered ||
                                        submitting
                                    }
                                    onChange={(e) =>
                                        handleFillInput(
                                            currentQuestion,
                                            e.target
                                                .value
                                        )
                                    }
                                    onKeyDown={(e) => {
                                        if (
                                            e.key ===
                                            "Enter"
                                        ) {
                                            e.preventDefault();

                                            handleFillBlankSubmit();
                                        }
                                    }}
                                />

                                {!isAnswered && (
                                    <button
                                        type="button"
                                        className="check-answer-button"
                                        onClick={
                                            handleFillBlankSubmit
                                        }
                                        disabled={
                                            submitting ||
                                            !selectedAnswer.trim()
                                        }
                                    >
                                        Check Answer
                                    </button>
                                )}
                            </div>
                        )}

                        {/* ANSWER FEEDBACK */}

                        {isAnswered && (
                            <div
                                className={
                                    isCorrect
                                        ? "answer-feedback correct-feedback"
                                        : "answer-feedback wrong-feedback"
                                }
                            >
                                <div className="feedback-header">
                                    <span className="feedback-icon">
                                        {isCorrect
                                            ? "✅"
                                            : "❌"}
                                    </span>

                                    <strong>
                                        {isCorrect
                                            ? "Correct Answer!"
                                            : "Incorrect Answer"}
                                    </strong>
                                </div>

                                {!isCorrect && (
                                    <div className="correct-answer-text">
                                        <strong>
                                            Correct Answer:
                                        </strong>

                                        <span>
                                            {
                                                question.correctAnswer
                                            }
                                        </span>
                                    </div>
                                )}

                                <div className="explanation">
                                    <strong>
                                        💡 Explanation
                                    </strong>

                                    <p>
                                        {question.explanation ||
                                            "No explanation was provided for this question."}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* NAVIGATION */}

                        {isAnswered && (
                            <div className="question-navigation">
                                {currentQuestion >
                                    0 && (
                                    <button
                                        type="button"
                                        className="previous-question-button"
                                        onClick={
                                            handlePreviousQuestion
                                        }
                                        disabled={
                                            submitting
                                        }
                                    >
                                        ← Previous
                                    </button>
                                )}

                                <div className="navigation-spacer"></div>

                                {currentQuestion <
                                totalQuestions -
                                    1 ? (
                                    <button
                                        type="button"
                                        className="next-question-button"
                                        onClick={
                                            handleNextQuestion
                                        }
                                        disabled={
                                            submitting
                                        }
                                    >
                                        Next Question →
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="submit-quiz-button"
                                        onClick={
                                            handleSubmit
                                        }
                                        disabled={
                                            submitting
                                        }
                                    >
                                        {submitting
                                            ? "Submitting..."
                                            : "Submit Quiz →"}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Quiz;