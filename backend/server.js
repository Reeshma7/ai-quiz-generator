const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const quizRoutes = require("./routes/quizRoutes");
const authRoutes = require("./routes/auth");
const studyNoteRoutes = require("./routes/studyNoteRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/quizzes", quizRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/study-notes", studyNoteRoutes);

// MongoDB Connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
    });

// Test API
app.get("/", (req, res) => {
    res.json({
        message: "AI Quiz Generator API is running"
    });
});

// Server Port
const PORT = process.env.PORT || 5000;

// Start Server
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log("Server is now listening...");
});

// Server Error
server.on("error", (error) => {
    console.error("SERVER ERROR:", error);
});