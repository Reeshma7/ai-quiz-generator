import { useState } from "react";
import API from "../services/api";
import "../styles/StudyNotes.css";

function StudyNotes() {
    const [topic, setTopic] = useState("");
    const [difficulty, setDifficulty] = useState("Medium");
    const [noteLength, setNoteLength] = useState("Medium");
    const [note, setNote] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const formatContent = (content) => {
        if (!content) return [];

        let text = content
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .trim();

        const sectionHeadings = [
            "INTRODUCTION TO JAVA",
            "IMPORTANT DEFINITIONS",
            "CORE CONCEPTS OF JAVA",
            "PRACTICAL EXAMPLE",
            "PRACTICAL EXAMPLES",
            "EXAMPLE",
            "KEY POINTS FOR QUICK REVISION",
            "KEY POINTS",
            "QUICK REVISION",
            "CONCLUSION"
        ];

        sectionHeadings.forEach((heading) => {
            const escapedHeading = heading.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            const regex = new RegExp(
                `\\s*${escapedHeading}\\s*`,
                "gi"
            );

            text = text.replace(regex, `\n\n${heading}\n\n`);
        });

        text = text.replace(
            /(?:^|\s)(\d+\.\s+[A-Z][^.\n]{2,80})(?=\s)/g,
            "\n\n$1\n"
        );

        text = text.replace(/\s+-\s+/g, "\n- ");
        text = text.replace(/\s+\*\s+/g, "\n* ");
        text = text.replace(/\s+•\s+/g, "\n• ");

        return text
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line !== "");
    };

    const renderContent = (content) => {
        const lines = formatContent(content);
        const elements = [];

        let insideCodeBlock = false;
        let codeLines = [];

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();

            if (trimmedLine.startsWith("```")) {
                if (insideCodeBlock) {
                    elements.push(
                        <pre
                            className="study-note-code"
                            key={`code-${index}`}
                        >
                            <code>{codeLines.join("\n")}</code>
                        </pre>
                    );

                    codeLines = [];
                    insideCodeBlock = false;
                } else {
                    insideCodeBlock = true;
                }

                return;
            }

            if (insideCodeBlock) {
                codeLines.push(line);
                return;
            }

            const isHeading = [
                "INTRODUCTION TO JAVA",
                "INTRODUCTION",
                "IMPORTANT DEFINITIONS",
                "CORE CONCEPTS OF JAVA",
                "CORE CONCEPTS",
                "PRACTICAL EXAMPLE",
                "PRACTICAL EXAMPLES",
                "EXAMPLE",
                "KEY POINTS FOR QUICK REVISION",
                "KEY POINTS",
                "QUICK REVISION",
                "CONCLUSION"
            ].includes(trimmedLine.toUpperCase());

            const isBullet =
                trimmedLine.startsWith("-") ||
                trimmedLine.startsWith("*") ||
                trimmedLine.startsWith("•");

            const isNumbered = /^\d+\.\s/.test(trimmedLine);

            if (isHeading) {
                elements.push(
                    <h3
                        className="study-note-section-title"
                        key={`heading-${index}`}
                    >
                        {trimmedLine}
                    </h3>
                );

                return;
            }

            if (isBullet) {
                elements.push(
                    <div
                        className="study-note-bullet"
                        key={`bullet-${index}`}
                    >
                        <span>•</span>
                        <p>
                            {trimmedLine.replace(/^[-*•]\s*/, "")}
                        </p>
                    </div>
                );

                return;
            }

            if (isNumbered) {
                elements.push(
                    <div
                        className="study-note-numbered"
                        key={`number-${index}`}
                    >
                        <p>{trimmedLine}</p>
                    </div>
                );

                return;
            }

            elements.push(
                <p
                    className="study-note-paragraph"
                    key={`paragraph-${index}`}
                >
                    {trimmedLine}
                </p>
            );
        });

        if (codeLines.length > 0) {
            elements.push(
                <pre
                    className="study-note-code"
                    key="final-code"
                >
                    <code>{codeLines.join("\n")}</code>
                </pre>
            );
        }

        return elements;
    };

    const getDownloadText = () => {
        if (!note) return "";

        return `${note.title}

Topic: ${note.topic}

Difficulty: ${note.difficulty}

Note Length: ${note.noteLength}

${note.content}`;
    };

    const handleDownload = () => {
        if (!note) return;

        const text = getDownloadText();

        const blob = new Blob([text], {
            type: "text/plain;charset=utf-8"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `${note.topic
            .replace(/[^a-z0-9]/gi, "_")
            .toLowerCase()}_study_notes.txt`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleGenerateNotes = async (e) => {
        e.preventDefault();

        if (!topic.trim()) {
            setError("Please enter a topic.");
            return;
        }

        const token = localStorage.getItem("token");

        if (!token) {
            setError("Please login to generate study notes.");
            return;
        }

        setLoading(true);
        setError("");
        setNote(null);

        try {
            const response = await API.post(
                "/study-notes/generate",
                {
                    topic: topic.trim(),
                    difficulty,
                    noteLength
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setNote(response.data.note);
        } catch (error) {
            console.error("Study Notes Error:", error);

            if (error.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");

                setError("Session expired. Please login again.");
            } else {
                setError(
                    error.response?.data?.message ||
                    error.message ||
                    "Something went wrong."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="study-notes-page">
            <div className="study-notes-container">
                <div className="study-notes-header">
                    <h1>🤖 AI Study Notes</h1>
                    <p>
                        Generate simple and personalized
                        study notes using AI.
                    </p>
                </div>

                <form
                    className="study-notes-form"
                    onSubmit={handleGenerateNotes}
                >
                    <div className="form-group">
                        <label htmlFor="topic">
                            Enter Topic
                        </label>

                        <input
                            id="topic"
                            type="text"
                            placeholder="e.g. JavaScript Promises"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="difficulty">
                                Difficulty
                            </label>

                            <select
                                id="difficulty"
                                value={difficulty}
                                onChange={(e) =>
                                    setDifficulty(e.target.value)
                                }
                            >
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="noteLength">
                                Note Length
                            </label>

                            <select
                                id="noteLength"
                                value={noteLength}
                                onChange={(e) =>
                                    setNoteLength(e.target.value)
                                }
                            >
                                <option value="Short">Short</option>
                                <option value="Medium">Medium</option>
                                <option value="Detailed">Detailed</option>
                            </select>
                        </div>
                    </div>

                    {error && (
                        <div className="study-notes-error">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="generate-notes-button"
                        disabled={loading}
                    >
                        {loading
                            ? "🤖 Generating Notes..."
                            : "✨ Generate Study Notes"}
                    </button>
                </form>

                {note && (
                    <div className="study-note-result">
                        <div className="study-note-result-header">
                            <div>
                                <span className="study-note-badge">
                                    {note.difficulty}
                                </span>

                                <span className="study-note-badge">
                                    {note.noteLength}
                                </span>
                            </div>

                            <span className="study-note-topic">
                                {note.topic}
                            </span>
                        </div>

                        <h2>{note.title}</h2>

                        <div className="study-note-content">
                            {renderContent(note.content)}
                        </div>

                        <div className="study-note-actions">
                            <button
                                type="button"
                                className="download-notes-button"
                                onClick={handleDownload}
                            >
                                📥 Download Notes
                            </button>

                            <button
                                type="button"
                                className="print-notes-button"
                                onClick={handlePrint}
                            >
                                🖨️ Print Notes
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default StudyNotes;