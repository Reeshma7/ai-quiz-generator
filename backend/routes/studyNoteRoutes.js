const express = require("express");
const mongoose = require("mongoose");
const StudyNote = require("../models/StudyNote");
const { generateStudyNotes } = require("../services/aiService");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/generate", protect, async (req, res) => {
    try {
        const {
            topic,
            difficulty = "Medium",
            noteLength = "Medium"
        } = req.body;

        if (!topic || !topic.trim()) {
            return res.status(400).json({
                message: "Topic is required"
            });
        }

        if (!["Easy", "Medium", "Hard"].includes(difficulty)) {
            return res.status(400).json({
                message: "Invalid difficulty"
            });
        }

        if (!["Short", "Medium", "Detailed"].includes(noteLength)) {
            return res.status(400).json({
                message: "Invalid note length"
            });
        }

        const generatedNote = await generateStudyNotes(
            topic.trim(),
            difficulty,
            noteLength
        );

        const studyNote = new StudyNote({
            userId: req.user._id,
            topic: topic.trim(),
            difficulty,
            noteLength,
            title: generatedNote.title,
            content: generatedNote.content
        });

        await studyNote.save();

        res.status(201).json({
            message: "Study notes generated successfully",
            note: studyNote
        });
    } catch (error) {
        console.error("Study Note Generation Error:", error);

        res.status(500).json({
            message: "Failed to generate study notes",
            error: error.message
        });
    }
});

router.get("/", protect, async (req, res) => {
    try {
        const notes = await StudyNote.find({
            userId: req.user._id
        }).sort({ createdAt: -1 });

        res.status(200).json(notes);
    } catch (error) {
        console.error("Get Study Notes Error:", error);

        res.status(500).json({
            message: "Failed to fetch study notes",
            error: error.message
        });
    }
});

router.get("/:id", protect, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid study note ID"
            });
        }

        const note = await StudyNote.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!note) {
            return res.status(404).json({
                message: "Study note not found"
            });
        }

        res.status(200).json(note);
    } catch (error) {
        console.error("Get Study Note Error:", error);

        res.status(500).json({
            message: "Failed to fetch study note",
            error: error.message
        });
    }
});

router.delete("/:id", protect, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid study note ID"
            });
        }

        const note = await StudyNote.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!note) {
            return res.status(404).json({
                message: "Study note not found"
            });
        }

        res.status(200).json({
            message: "Study note deleted successfully"
        });
    } catch (error) {
        console.error("Delete Study Note Error:", error);

        res.status(500).json({
            message: "Failed to delete study note",
            error: error.message
        });
    }
});

module.exports = router;