const express = require("express");

const Quiz = require("../models/Quiz");
const Result = require("../models/Result");

const {
    generateQuiz,
    generateHint
} = require("../services/aiService");

const protect =
    require("../middleware/authMiddleware");

const router = express.Router();

// ======================================================
// HELPER - NORMALIZE QUESTION TEXT
// ======================================================

const normalizeQuestion = (question) => {
    return String(question || "")
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
};

// ======================================================
// GET USER'S CORRECTLY ANSWERED QUESTIONS
// ======================================================

const getCorrectlyAnsweredQuestions = async (
    userId,
    topic
) => {
    if (!userId) {
        return [];
    }

    const results =
        await Result.find({
            userId
        });

    if (!results || results.length === 0) {
        return [];
    }

    const requestedTopic =
        normalizeQuestion(topic);

    const correctQuestionIds =
        new Set();

    results.forEach((result) => {
        const resultTopic =
            normalizeQuestion(result.topic);

        if (
            requestedTopic &&
            resultTopic !== requestedTopic
        ) {
            return;
        }

        if (
            !Array.isArray(result.answers)
        ) {
            return;
        }

        result.answers.forEach((answer) => {
            if (
                answer &&
                answer.isCorrect === true &&
                answer.questionId
            ) {
                correctQuestionIds.add(
                    String(answer.questionId)
                );
            }
        });
    });

    if (correctQuestionIds.size === 0) {
        return [];
    }

    const quizzes =
        await Quiz.find({
            "questions._id": {
                $in:
                    Array.from(
                        correctQuestionIds
                    )
            }
        });

    const correctQuestions = [];

    quizzes.forEach((quiz) => {
        if (!Array.isArray(quiz.questions)) {
            return;
        }

        quiz.questions.forEach((question) => {
            if (
                question &&
                correctQuestionIds.has(
                    String(question._id)
                )
            ) {
                const normalized =
                    normalizeQuestion(
                        question.question
                    );

                if (normalized) {
                    correctQuestions.push(
                        normalized
                    );
                }
            }
        });
    });

    return [
        ...new Set(correctQuestions)
    ];
};

// ======================================================
// CHECK GENERATED QUESTIONS AGAINST USER HISTORY
// ======================================================

const containsPreviouslyCorrectQuestion = (
    questions,
    blockedQuestions
) => {
    if (
        !Array.isArray(questions) ||
        !Array.isArray(blockedQuestions)
    ) {
        return false;
    }

    const blockedSet =
        new Set(blockedQuestions);

    return questions.some((question) => {
        const normalized =
            normalizeQuestion(
                question.question
            );

        return blockedSet.has(
            normalized
        );
    });
};

// ======================================================
// CREATE QUIZ
// ======================================================

router.post("/create", async (req, res) => {
    try {
        const {
            topic,
            difficulty,
            numberOfQuestions,
            questions
        } = req.body;

        if (
            !topic ||
            !difficulty ||
            !numberOfQuestions ||
            !questions
        ) {
            return res.status(400).json({
                message:
                    "Topic, difficulty, numberOfQuestions and questions are required"
            });
        }

        const quiz = new Quiz({
            topic,
            difficulty,
            numberOfQuestions:
                Number(numberOfQuestions),
            questions
        });

        const savedQuiz =
            await quiz.save();

        return res.status(201).json({
            message:
                "Quiz created successfully",
            quiz:
                savedQuiz
        });

    } catch (error) {
        console.error(
            "Create quiz error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to create quiz",
            error:
                error.message
        });
    }
});

// ======================================================
// GET ALL QUIZZES
// ======================================================

router.get("/", async (req, res) => {
    try {
        const quizzes =
            await Quiz.find()
                .sort({
                    createdAt: -1
                });

        return res.status(200).json({
            message:
                "Quizzes fetched successfully",
            count:
                quizzes.length,
            quizzes
        });

    } catch (error) {
        console.error(
            "Get quizzes error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch quizzes",
            error:
                error.message
        });
    }
});

// ======================================================
// GENERATE AI QUIZ
// ======================================================

router.post("/generate", async (req, res) => {
    try {
        const {
            topic,
            difficulty,
            numberOfQuestions
        } = req.body;

        if (
            !topic ||
            !difficulty ||
            !numberOfQuestions
        ) {
            return res.status(400).json({
                message:
                    "Topic, difficulty and numberOfQuestions are required"
            });
        }

        const requestedQuestions =
            Number(numberOfQuestions);

        if (
            !Number.isInteger(
                requestedQuestions
            ) ||
            requestedQuestions <= 0
        ) {
            return res.status(400).json({
                message:
                    "numberOfQuestions must be a positive integer"
            });
        }

        console.log(
            "================================="
        );

        console.log(
            "GENERATING AI QUIZ"
        );

        console.log(
            "Topic:",
            topic
        );

        console.log(
            "Difficulty:",
            difficulty
        );

        console.log(
            "Questions:",
            requestedQuestions
        );

        console.log(
            "================================="
        );

        // ==================================================
        // GET LOGGED-IN USER FROM TOKEN IF AVAILABLE
        // ==================================================

        let userId = null;

        const authorization =
            req.headers.authorization;

        if (
            authorization &&
            authorization.startsWith("Bearer ")
        ) {
            try {
                const jwt =
                    require("jsonwebtoken");

                const token =
                    authorization.split(" ")[1];

                const decoded =
                    jwt.verify(
                        token,
                        process.env.JWT_SECRET
                    );

                if (
                    decoded &&
                    (
                        decoded.id ||
                        decoded._id ||
                        decoded.userId
                    )
                ) {
                    userId =
                        decoded.id ||
                        decoded._id ||
                        decoded.userId;
                }

            } catch (authError) {
                console.log(
                    "No valid user token found. Generating quiz without personalized history."
                );
            }
        }

        // ==================================================
        // GET PREVIOUSLY CORRECT QUESTIONS
        // ==================================================

        let blockedQuestions = [];

        if (userId) {
            blockedQuestions =
                await getCorrectlyAnsweredQuestions(
                    userId,
                    topic
                );

            console.log(
                "Previously correct questions:",
                blockedQuestions.length
            );
        }

        // ==================================================
        // GENERATE QUIZ
        // ==================================================

        let selectedQuestions = [];

        const maxAttempts = 5;

        for (
            let attempt = 1;
            attempt <= maxAttempts;
            attempt++
        ) {
            console.log(
                `AI quiz generation attempt ${attempt}/${maxAttempts}`
            );

            const aiQuiz =
                await generateQuiz(
                    topic,
                    difficulty,
                    requestedQuestions,
                    blockedQuestions
                );

            if (
                !aiQuiz ||
                !Array.isArray(
                    aiQuiz.questions
                )
            ) {
                throw new Error(
                    "AI did not return valid quiz questions"
                );
            }

            // ------------------------------------------
            // Remove questions already correctly answered
            // ------------------------------------------

            const allowedQuestions =
                aiQuiz.questions.filter(
                    (question) => {
                        const normalized =
                            normalizeQuestion(
                                question.question
                            );

                        return !blockedQuestions.includes(
                            normalized
                        );
                    }
                );

            // ------------------------------------------
            // Avoid duplicate questions within the
            // newly selected quiz.
            // ------------------------------------------

            const currentQuestionSet =
                new Set();

            allowedQuestions.forEach(
                (question) => {
                    const normalized =
                        normalizeQuestion(
                            question.question
                        );

                    if (
                        normalized &&
                        !currentQuestionSet.has(
                            normalized
                        )
                    ) {
                        currentQuestionSet.add(
                            normalized
                        );

                        selectedQuestions.push(
                            question
                        );
                    }
                }
            );

            // ------------------------------------------
            // Remove duplicates from previous attempts
            // ------------------------------------------

            const uniqueSelectedQuestions = [];

            const selectedSet = new Set();

            selectedQuestions.forEach(
                (question) => {
                    const normalized =
                        normalizeQuestion(
                            question.question
                        );

                    if (
                        normalized &&
                        !selectedSet.has(
                            normalized
                        )
                    ) {
                        selectedSet.add(
                            normalized
                        );

                        uniqueSelectedQuestions.push(
                            question
                        );
                    }
                }
            );

            selectedQuestions =
                uniqueSelectedQuestions;

            // ------------------------------------------
            // Stop once enough questions are available
            // ------------------------------------------

            if (
                selectedQuestions.length >=
                requestedQuestions
            ) {
                selectedQuestions =
                    selectedQuestions.slice(
                        0,
                        requestedQuestions
                    );

                break;
            }
        }

        // ==================================================
        // FINAL VALIDATION
        // ==================================================

        if (
            selectedQuestions.length <
            requestedQuestions
        ) {
            return res.status(503).json({
                message:
                    "Not enough new questions were generated. Please try generating the quiz again.",
                availableQuestions:
                    selectedQuestions.length,
                requestedQuestions
            });
        }

        // ==================================================
        // CREATE QUIZ
        // ==================================================

        const quiz = new Quiz({
            topic,
            difficulty,
            numberOfQuestions:
                requestedQuestions,
            questions:
                selectedQuestions
        });

        const savedQuiz =
            await quiz.save();

        // ==================================================
        // RESPONSE
        // ==================================================

        return res.status(201).json({
            message:
                "AI quiz generated successfully",
            quiz:
                savedQuiz
        });

    } catch (error) {
        console.error(
            "AI quiz generation error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to generate AI quiz",
            error:
                error.message
        });
    }
});

// ======================================================
// AI HINT
// ======================================================

router.post("/hint", protect, async (req, res) => {
    try {
        const {
            question,
            options,
            difficulty,
            hintLevel
        } = req.body;

        if (
            !question ||
            typeof question !== "string"
        ) {
            return res.status(400).json({
                message:
                    "Question is required"
            });
        }

        const safeOptions =
            Array.isArray(options)
                ? options
                : [];

        const safeDifficulty =
            difficulty || "Medium";

        let safeHintLevel =
            Number(hintLevel) || 1;

        if (safeHintLevel < 1) {
            safeHintLevel = 1;
        }

        if (safeHintLevel > 3) {
            safeHintLevel = 3;
        }

        console.log(
            "================================="
        );

        console.log(
            "GENERATING AI HINT"
        );

        console.log(
            "Question:",
            question
        );

        console.log(
            "Difficulty:",
            safeDifficulty
        );

        console.log(
            "Hint Level:",
            safeHintLevel
        );

        console.log(
            "================================="
        );

        const hint =
            await generateHint(
                question,
                safeOptions,
                safeDifficulty,
                safeHintLevel
            );

        if (!hint) {
            return res.status(500).json({
                message:
                    "AI did not generate a hint"
            });
        }

        return res.status(200).json({
            message:
                "AI hint generated successfully",
            hint
        });

    } catch (error) {
        console.error(
            "AI hint generation error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to generate AI hint",
            error:
                error.message
        });
    }
});

// ======================================================
// GET LOGGED-IN USER RESULTS
// ======================================================

router.get(
    "/results",
    protect,
    async (req, res) => {
        try {
            const results =
                await Result.find({
                    userId:
                        req.user._id
                })
                .sort({
                    createdAt: -1
                });

            return res.status(200).json({
                message:
                    "Results fetched successfully",
                count:
                    results.length,
                results
            });

        } catch (error) {
            console.error(
                "Get results error:",
                error
            );

            return res.status(500).json({
                message:
                    "Failed to fetch results",
                error:
                    error.message
            });
        }
    }
);

// ======================================================
// GET SINGLE RESULT
// ======================================================

router.get(
    "/results/:id",
    protect,
    async (req, res) => {
        try {
            const result =
                await Result.findOne({
                    _id:
                        req.params.id,
                    userId:
                        req.user._id
                });

            if (!result) {
                return res.status(404).json({
                    message:
                        "Result not found"
                });
            }

            return res.status(200).json({
                message:
                    "Result fetched successfully",
                result
            });

        } catch (error) {
            console.error(
                "Get result error:",
                error
            );

            return res.status(500).json({
                message:
                    "Failed to fetch result",
                error:
                    error.message
            });
        }
    }
);

// ======================================================
// DASHBOARD STATS
// ======================================================

router.get(
    "/dashboard/stats",
    protect,
    async (req, res) => {
        try {
            const results =
                await Result.find({
                    userId:
                        req.user._id
                });

            const totalQuizzes =
                results.length;

            if (totalQuizzes === 0) {
                return res.status(200).json({
                    totalQuizzes: 0,
                    averageScore: 0,
                    bestScore: 0,
                    quizzesToday: 0
                });
            }

            const totalPercentage =
                results.reduce(
                    (sum, result) =>
                        sum +
                        Number(
                            result.percentage || 0
                        ),
                    0
                );

            const averageScore =
                Math.round(
                    totalPercentage /
                    totalQuizzes
                );

            const bestScore =
                Math.max(
                    ...results.map(
                        result =>
                            Number(
                                result.percentage || 0
                            )
                    )
                );

            // ------------------------------------------
            // TODAY
            // ------------------------------------------

            const today =
                new Date();

            today.setHours(
                0,
                0,
                0,
                0
            );

            const tomorrow =
                new Date(today);

            tomorrow.setDate(
                tomorrow.getDate() + 1
            );

            const quizzesToday =
                results.filter(
                    (result) => {
                        const resultDate =
                            new Date(
                                result.createdAt
                            );

                        return (
                            resultDate >= today &&
                            resultDate < tomorrow
                        );
                    }
                ).length;

            return res.status(200).json({
                totalQuizzes,
                averageScore,
                bestScore,
                quizzesToday
            });

        } catch (error) {
            console.error(
                "Dashboard statistics error:",
                error
            );

            return res.status(500).json({
                message:
                    "Failed to load dashboard statistics",
                error:
                    error.message
            });
        }
    }
);

// ======================================================
// WEAK AREAS
// ======================================================

router.get(
    "/dashboard/weak-areas",
    protect,
    async (req, res) => {
        try {
            const results =
                await Result.find({
                    userId:
                        req.user._id
                });

            if (results.length === 0) {
                return res.status(200).json({
                    weakAreas: []
                });
            }

            const topicData = {};

            results.forEach(
                (result) => {
                    const topic =
                        result.topic;

                    if (!topicData[topic]) {
                        topicData[topic] = {
                            totalScore: 0,
                            attempts: 0
                        };
                    }

                    topicData[topic]
                        .totalScore +=
                        Number(
                            result.percentage || 0
                        );

                    topicData[topic]
                        .attempts++;
                }
            );

            const topicPerformance =
                Object.keys(topicData)
                    .map(
                        (topic) => {
                            const average =
                                topicData[topic]
                                    .totalScore /
                                topicData[topic]
                                    .attempts;

                            return {
                                topic,
                                averageScore:
                                    Math.round(
                                        average
                                    ),
                                attempts:
                                    topicData[topic]
                                        .attempts
                            };
                        }
                    );

            topicPerformance.sort(
                (a, b) =>
                    a.averageScore -
                    b.averageScore
            );

            const weakAreas =
                topicPerformance.filter(
                    (topic) =>
                        topic.averageScore < 60
                );

            return res.status(200).json({
                weakAreas
            });

        } catch (error) {
            console.error(
                "Weak area detection error:",
                error
            );

            return res.status(500).json({
                message:
                    "Failed to detect weak areas",
                error:
                    error.message
            });
        }
    }
);

// ======================================================
// GET SINGLE QUIZ
// ======================================================

router.get(
    "/:id",
    async (req, res) => {
        try {
            const quiz =
                await Quiz.findById(
                    req.params.id
                );

            if (!quiz) {
                return res.status(404).json({
                    message:
                        "Quiz not found"
                });
            }

            return res.status(200).json({
                message:
                    "Quiz fetched successfully",
                quiz
            });

        } catch (error) {
            console.error(
                "Get quiz error:",
                error
            );

            return res.status(500).json({
                message:
                    "Failed to fetch quiz",
                error:
                    error.message
            });
        }
    }
);

// ======================================================
// SUBMIT QUIZ
// ======================================================

router.post(
    "/:id/submit",
    protect,
    async (req, res) => {
        try {
            const { answers } =
                req.body;

            // ------------------------------------------
            // USER AUTHENTICATION
            // ------------------------------------------

            if (
                !req.user ||
                !req.user._id
            ) {
                return res.status(401).json({
                    message:
                        "User authentication required."
                });
            }

            // ------------------------------------------
            // ANSWERS VALIDATION
            // ------------------------------------------

            if (
                !answers ||
                !Array.isArray(answers)
            ) {
                return res.status(400).json({
                    message:
                        "Answers must be provided as an array"
                });
            }

            // ------------------------------------------
            // FIND QUIZ
            // ------------------------------------------

            const quiz =
                await Quiz.findById(
                    req.params.id
                );

            if (!quiz) {
                return res.status(404).json({
                    message:
                        "Quiz not found"
                });
            }

            // ------------------------------------------
            // SCORE QUIZ
            // ------------------------------------------

            let score = 0;

            const answerDetails =
                quiz.questions.map(
                    (question, index) => {

                        // --------------------------------
                        // GET USER ANSWER
                        // --------------------------------

                        const rawUserAnswer =
                            answers[index];

                        const userAnswer =
                            rawUserAnswer !== undefined &&
                            rawUserAnswer !== null &&
                            String(rawUserAnswer).trim() !== ""
                                ? String(rawUserAnswer).trim()
                                : null;

                        // --------------------------------
                        // GET CORRECT ANSWER
                        // --------------------------------

                        const correctAnswer =
                            question.correctAnswer;

                        // --------------------------------
                        // QUESTION TYPE
                        // --------------------------------

                        const questionType =
                            question.type ||
                            "mcq";

                        // --------------------------------
                        // CHECK ANSWER
                        // --------------------------------

                        let isCorrect = false;

                        if (
                            userAnswer !== null &&
                            correctAnswer !== undefined &&
                            correctAnswer !== null
                        ) {

                            // ==================================
                            // FILL IN THE BLANK
                            // ==================================

                            if (
                                questionType ===
                                "fill_blank"
                            ) {
                                isCorrect =
                                    String(userAnswer)
                                        .trim()
                                        .toLowerCase() ===
                                    String(correctAnswer)
                                        .trim()
                                        .toLowerCase();
                            }

                            // ==================================
                            // MCQ
                            // ==================================

                            else if (
                                questionType ===
                                "mcq"
                            ) {
                                isCorrect =
                                    String(userAnswer)
                                        .trim() ===
                                    String(correctAnswer)
                                        .trim();
                            }

                            // ==================================
                            // DRAG & DROP
                            // ==================================

                            else if (
                                questionType ===
                                "drag_drop"
                            ) {
                                isCorrect =
                                    String(userAnswer)
                                        .trim() ===
                                    String(correctAnswer)
                                        .trim();
                            }

                            // ==================================
                            // OLD MULTIPLE CHOICE
                            // ==================================

                            else if (
                                questionType ===
                                "multiple_choice"
                            ) {
                                isCorrect =
                                    String(userAnswer)
                                        .trim() ===
                                    String(correctAnswer)
                                        .trim();
                            }

                            // ==================================
                            // OLD DROPDOWN
                            // ==================================

                            else if (
                                questionType ===
                                "dropdown"
                            ) {
                                isCorrect =
                                    String(userAnswer)
                                        .trim() ===
                                    String(correctAnswer)
                                        .trim();
                            }

                            // ==================================
                            // UNKNOWN TYPE
                            // ==================================

                            else {
                                isCorrect =
                                    String(userAnswer)
                                        .trim() ===
                                    String(correctAnswer)
                                        .trim();
                            }
                        }

                        // ----------------------------------
                        // INCREASE SCORE
                        // ----------------------------------

                        if (isCorrect) {
                            score++;
                        }

                        // ----------------------------------
                        // STORE ANSWER DETAILS
                        // ----------------------------------

                        return {
                            questionId:
                                question._id,
                            userAnswer,
                            correctAnswer,
                            isCorrect
                        };
                    }
                );

            // ------------------------------------------
            // TOTAL QUESTIONS
            // ------------------------------------------

            const totalQuestions =
                quiz.questions.length;

            // ------------------------------------------
            // PERCENTAGE
            // ------------------------------------------

            const percentage =
                totalQuestions > 0
                    ? Math.round(
                        (
                            score /
                            totalQuestions
                        ) * 100
                    )
                    : 0;

            // ------------------------------------------
            // CREATE RESULT
            // ------------------------------------------

            const result =
                new Result({
                    userId:
                        req.user._id,
                    quizId:
                        quiz._id,
                    topic:
                        quiz.topic,
                    difficulty:
                        quiz.difficulty,
                    score,
                    totalQuestions,
                    percentage,
                    answers:
                        answerDetails
                });

            // ------------------------------------------
            // SAVE RESULT
            // ------------------------------------------

            const savedResult =
                await result.save();

            console.log(
                "Result saved:",
                savedResult._id.toString()
            );

            // ------------------------------------------
            // RESPONSE
            // ------------------------------------------

            return res.status(200).json({
                message:
                    "Quiz submitted successfully",
                result:
                    savedResult
            });

        } catch (error) {
            console.error(
                "Submit quiz error:",
                error
            );

            return res.status(500).json({
                message:
                    "Failed to submit quiz",
                error:
                    error.message
            });
        }
    }
);

module.exports = router;