const mongoose = require("mongoose");

const studyNoteSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        topic: {
            type: String,
            required: true,
            trim: true
        },
        difficulty: {
            type: String,
            enum: ["Easy", "Medium", "Hard"],
            default: "Medium"
        },
        noteLength: {
            type: String,
            enum: ["Short", "Medium", "Detailed"],
            default: "Medium"
        },
        title: {
            type: String,
            required: true
        },
        content: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("StudyNote", studyNoteSchema);