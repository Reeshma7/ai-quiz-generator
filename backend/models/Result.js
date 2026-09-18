const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema(
    {
        // =================================
        // USER
        // =================================
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // =================================
        // QUIZ
        // =================================
        quizId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Quiz",
            required: true
        },

        // =================================
        // QUIZ INFORMATION
        // =================================
        topic: {
            type: String,
            required: true,
            trim: true
        },

        difficulty: {
            type: String,
            required: true,
            trim: true
        },

        // =================================
        // SCORE
        // =================================
        score: {
            type: Number,
            required: true,
            min: 0
        },

        totalQuestions: {
            type: Number,
            required: true,
            min: 1
        },

        percentage: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },

        // =================================
        // ANSWERS
        // =================================
        answers: [
            {
                questionId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true
                },

                userAnswer: {
                    type: String,
                    default: null
                },

                correctAnswer: {
                    type: String,
                    required: true
                },

                isCorrect: {
                    type: Boolean,
                    required: true
                }
            }
        ]
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Result",
    resultSchema
);