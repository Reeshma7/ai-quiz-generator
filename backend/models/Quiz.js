const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },

    // MCQ and Drag & Drop use options
    // Fill in the blank uses an empty array
    options: {
        type: [String],
        default: []
    },

    // Question pattern
    type: {
        type: String,
        enum: ["mcq", "fill_blank", "drag_drop"],
        default: "mcq",
        required: true
    },

    correctAnswer: {
        type: String,
        required: true
    },

    explanation: {
        type: String,
        default: ""
    }
});


const quizSchema = new mongoose.Schema(
    {
        topic: {
            type: String,
            required: true
        },

        difficulty: {
            type: String,
            enum: ["Easy", "Medium", "Hard"],
            required: true
        },

        numberOfQuestions: {
            type: Number,
            required: true
        },

        questions: {
            type: [questionSchema],
            required: true
        }
    },
    {
        timestamps: true
    }
);


module.exports = mongoose.model("Quiz", quizSchema);