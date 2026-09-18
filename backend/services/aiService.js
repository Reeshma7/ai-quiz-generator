const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
        apiVersion: "v1"
    }
});

/* =========================================================
   AI REQUEST HELPER
========================================================= */
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const isRetryableError = (error) => {
    const status = error?.status || error?.code;

    return (
        status === 429 ||
        status === 503 ||
        status === 500 ||
        status === 502 ||
        status === 504
    );
};

const generateWithRetry = async (
    request,
    models,
    maxRetries = 2
) => {
    let lastError;

    for (const model of models) {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                console.log(
                    `AI request using model: ${model} | Attempt: ${attempt + 1}`
                );

                return await ai.models.generateContent({
                    ...request,
                    model
                });
            } catch (error) {
                lastError = error;

                console.error(
                    `AI request failed | Model: ${model} | Attempt: ${attempt + 1} | Status: ${error?.status || error?.code}`
                );

                if (!isRetryableError(error)) {
                    throw error;
                }

                if (attempt < maxRetries) {
                    const delay = 1500 * Math.pow(2, attempt);

                    console.log(
                        `Retrying in ${delay}ms...`
                    );

                    await sleep(delay);
                }
            }
        }

        console.log(
            `Model ${model} is unavailable. Trying fallback model...`
        );
    }

    throw lastError;
};

/* =========================================================
   GENERATE QUIZ
========================================================= */
const generateQuiz = async (
    topic,
    difficulty,
    numberOfQuestions,
    excludedQuestions = []
) => {

    // ------------------------------------------
    // PREPARE EXCLUDED QUESTIONS
    // ------------------------------------------

    const safeExcludedQuestions =
        Array.isArray(excludedQuestions)
            ? excludedQuestions
                .filter(
                    question =>
                        typeof question === "string" &&
                        question.trim() !== ""
                )
                .map(
                    question =>
                        question.trim()
                )
            : [];


    // ------------------------------------------
    // BUILD EXCLUSION SECTION
    // ------------------------------------------

    let exclusionSection =
        "There are no previously correctly answered questions to exclude.";


    if (
        safeExcludedQuestions.length > 0
    ) {

        exclusionSection = `
The following questions have already been answered correctly by this student.

DO NOT generate these questions again.

PREVIOUSLY CORRECTLY ANSWERED QUESTIONS
=======================================

${safeExcludedQuestions
    .map(
        (question, index) =>
            `${index + 1}. ${question}`
    )
    .join("\n")}

IMPORTANT:
- Do not repeat any question from this list.
- Do not create a question that is only a minor rewording of a question from this list.
- Create a different question testing a different situation, example, fact, or application.
`;

    }


    const prompt = `
You are an AI quiz generator.

Generate a quiz based on the following details:

Topic: ${topic}
Difficulty: ${difficulty}
Number of Questions: ${numberOfQuestions}

=========================================================
PERSONALIZED QUESTION HISTORY
=========================================================

${exclusionSection}

=========================================================
QUESTION TYPES
=========================================================

Use a mixture of these three question types:

1. mcq
2. fill_blank
3. drag_drop

The quiz should contain a balanced mixture of the question types.

=========================================================
QUESTION TYPE RULES
=========================================================

MCQ:
- Provide exactly 4 options.
- correctAnswer must be exactly one of the options.

Fill in the Blank:
- The question must contain "_____".
- options must be an empty array.
- correctAnswer must contain the missing word or phrase.

Drag and Drop:
- Provide exactly 4 options.
- correctAnswer must be exactly one of the options.
- The question should be suitable for a drag-and-drop answer selection.

=========================================================
GENERAL RULES
=========================================================

- Questions must be clear and educational.
- Questions must match the requested difficulty.
- Do not create duplicate questions within this quiz.
- Do not create duplicate options.
- correctAnswer must always be correct.
- Do not generate any question from the previously correctly answered list.
- Do not create a minor rewording of a previously correctly answered question.
- Previously incorrect questions are allowed to appear again.
- Questions that the student has never answered are allowed.
- Keep questions relevant to the requested topic.
- Return exactly ${numberOfQuestions} questions.
- Return only valid JSON.
`;

    try {

        const response =
            await generateWithRetry(
                {
                    contents: prompt,
                    config: {
                        responseMimeType:
                            "application/json",

                        responseSchema: {
                            type: "object",

                            properties: {
                                topic: {
                                    type: "string"
                                },

                                difficulty: {
                                    type: "string",
                                    enum: [
                                        "Easy",
                                        "Medium",
                                        "Hard"
                                    ]
                                },

                                numberOfQuestions: {
                                    type: "integer"
                                },

                                questions: {
                                    type: "array",

                                    items: {
                                        type: "object",

                                        properties: {
                                            question: {
                                                type: "string"
                                            },

                                            options: {
                                                type: "array",

                                                items: {
                                                    type: "string"
                                                }
                                            },

                                            type: {
                                                type: "string",

                                                enum: [
                                                    "mcq",
                                                    "fill_blank",
                                                    "drag_drop"
                                                ]
                                            },

                                            correctAnswer: {
                                                type: "string"
                                            },

                                            explanation: {
                                                type: "string"
                                            }
                                        },

                                        required: [
                                            "question",
                                            "options",
                                            "type",
                                            "correctAnswer",
                                            "explanation"
                                        ]
                                    }
                                }
                            },

                            required: [
                                "topic",
                                "difficulty",
                                "numberOfQuestions",
                                "questions"
                            ]
                        }
                    }
                },

                [
                    "gemini-3.6-flash",
                    "gemini-3.5-flash-lite",
                    "gemini-3.5-flash"
                ]
            );


        const text =
            response.text
                ? response.text.trim()
                : "";


        if (!text) {

            throw new Error(
                "AI did not return any quiz data"
            );

        }


        const quiz =
            JSON.parse(text);


        if (
            !quiz.questions ||
            !Array.isArray(
                quiz.questions
            )
        ) {

            throw new Error(
                "Invalid quiz format received from AI"
            );

        }


        if (
            quiz.questions.length !==
            Number(numberOfQuestions)
        ) {

            throw new Error(
                `Expected ${numberOfQuestions} questions but received ${quiz.questions.length}`
            );

        }


        const validTypes = [
            "mcq",
            "fill_blank",
            "drag_drop"
        ];


        // ==================================================
        // VALIDATE QUESTIONS
        // ==================================================

        quiz.questions.forEach(
            (question, index) => {

                if (!question.question) {

                    throw new Error(
                        `Question ${index + 1} is missing question text`
                    );

                }


                if (!question.type) {

                    throw new Error(
                        `Question ${index + 1} is missing question type`
                    );

                }


                if (
                    !validTypes.includes(
                        question.type
                    )
                ) {

                    throw new Error(
                        `Question ${index + 1} has invalid question type`
                    );

                }


                if (
                    !question.correctAnswer
                ) {

                    throw new Error(
                        `Question ${index + 1} is missing correct answer`
                    );

                }


                // ==========================================
                // MCQ
                // ==========================================

                if (
                    question.type === "mcq"
                ) {

                    if (
                        !Array.isArray(
                            question.options
                        ) ||
                        question.options.length !== 4
                    ) {

                        throw new Error(
                            `MCQ question ${index + 1} must have exactly 4 options`
                        );

                    }


                    const uniqueOptions =
                        new Set(
                            question.options.map(
                                option =>
                                    option
                                        .trim()
                                        .toLowerCase()
                            )
                        );


                    if (
                        uniqueOptions.size !==
                        question.options.length
                    ) {

                        throw new Error(
                            `MCQ question ${index + 1} contains duplicate options`
                        );

                    }


                    const correctAnswerExists =
                        question.options.some(
                            option =>
                                option
                                    .trim()
                                    .toLowerCase() ===
                                question.correctAnswer
                                    .trim()
                                    .toLowerCase()
                        );


                    if (
                        !correctAnswerExists
                    ) {

                        throw new Error(
                            `MCQ question ${index + 1} correct answer is not present in options`
                        );

                    }

                }


                // ==========================================
                // FILL IN THE BLANK
                // ==========================================

                if (
                    question.type ===
                    "fill_blank"
                ) {

                    if (
                        !question.question.includes(
                            "_____"
                        )
                    ) {

                        throw new Error(
                            `Fill in the blank question ${index + 1} must contain "_____"`
                        );

                    }


                    if (
                        !Array.isArray(
                            question.options
                        ) ||
                        question.options.length !== 0
                    ) {

                        throw new Error(
                            `Fill in the blank question ${index + 1} must have an empty options array`
                        );

                    }

                }


                // ==========================================
                // DRAG & DROP
                // ==========================================

                if (
                    question.type ===
                    "drag_drop"
                ) {

                    if (
                        !Array.isArray(
                            question.options
                        ) ||
                        question.options.length !== 4
                    ) {

                        throw new Error(
                            `Drag and drop question ${index + 1} must have exactly 4 options`
                        );

                    }


                    const uniqueOptions =
                        new Set(
                            question.options.map(
                                option =>
                                    option
                                        .trim()
                                        .toLowerCase()
                            )
                        );


                    if (
                        uniqueOptions.size !==
                        question.options.length
                    ) {

                        throw new Error(
                            `Drag and drop question ${index + 1} contains duplicate options`
                        );

                    }


                    const correctAnswerExists =
                        question.options.some(
                            option =>
                                option
                                    .trim()
                                    .toLowerCase() ===
                                question.correctAnswer
                                    .trim()
                                    .toLowerCase()
                        );


                    if (
                        !correctAnswerExists
                    ) {

                        throw new Error(
                            `Drag and drop question ${index + 1} correct answer is not present in options`
                        );

                    }

                }

            }
        );


        // ==================================================
        // CHECK DUPLICATES WITHIN GENERATED QUIZ
        // ==================================================

        const generatedQuestionSet =
            new Set();


        quiz.questions.forEach(
            (question, index) => {

                const normalizedQuestion =
                    String(
                        question.question || ""
                    )
                        .toLowerCase()
                        .replace(
                            /[^\w\s]/g,
                            ""
                        )
                        .replace(
                            /\s+/g,
                            " "
                        )
                        .trim();


                if (
                    generatedQuestionSet.has(
                        normalizedQuestion
                    )
                ) {

                    throw new Error(
                        `Duplicate question detected at question ${index + 1}`
                    );

                }


                generatedQuestionSet.add(
                    normalizedQuestion
                );

            }
        );


        // ==================================================
        // CHECK PREVIOUSLY CORRECT QUESTIONS
        // ==================================================
        //
        // This is a second safety check in addition to the
        // prompt instruction.
        //
        // If Gemini accidentally generates an exact
        // previously-correct question, reject the response.
        // The route can then request another batch.
        // ==================================================

        if (
            safeExcludedQuestions.length > 0
        ) {

            const excludedSet =
                new Set(
                    safeExcludedQuestions.map(
                        question =>
                            String(question)
                                .toLowerCase()
                                .replace(
                                    /[^\w\s]/g,
                                    ""
                                )
                                .replace(
                                    /\s+/g,
                                    " "
                                )
                                .trim()
                    )
                );


            quiz.questions.forEach(
                (question, index) => {

                    const normalizedQuestion =
                        String(
                            question.question || ""
                        )
                            .toLowerCase()
                            .replace(
                                /[^\w\s]/g,
                                ""
                            )
                            .replace(
                                /\s+/g,
                                " "
                            )
                            .trim();


                    if (
                        excludedSet.has(
                            normalizedQuestion
                        )
                    ) {

                        throw new Error(
                            `Question ${index + 1} was already answered correctly by this user`
                        );

                    }

                }
            );

        }


        return quiz;

    } catch (error) {

        console.error(
            "AI quiz generation error:",
            error
        );

        throw error;

    }
};


/* =========================================================
   GENERATE AI HINT
========================================================= */
const generateHint = async (
    question,
    options = [],
    difficulty = "Medium",
    hintLevel = 1
) => {

    const prompt = `
You are an AI learning assistant.

The student is currently solving a quiz question.

Question:
${question}

Options:
${
    Array.isArray(options) &&
    options.length > 0
        ? options.join(", ")
        : "No options provided"
}

Difficulty:
${difficulty}

Hint Level:
${hintLevel}

YOUR TASK
=========

Generate a helpful hint that helps the student solve the question.

IMPORTANT RULES
===============

1. Do NOT directly give the correct answer.
2. Do NOT mention the correct answer explicitly.
3. Do NOT simply repeat the question.
4. Give a useful conceptual clue.
5. Keep the hint short and easy to understand.
6. The hint should match the difficulty level.
7. Do not use markdown.
8. Return only the hint text.

HINT LEVELS
===========

Level 1:
Give a small conceptual clue without getting too close to the answer.

Level 2:
Give a stronger clue that helps narrow down the answer.

Level 3:
Give a very strong clue, but still do not directly reveal the answer.

Generate only one hint.
`;

    try {

        const response =
            await generateWithRetry(
                {
                    contents: prompt,

                    config: {
                        responseMimeType:
                            "text/plain"
                    }
                },

                [
                    "gemini-3.6-flash",
                    "gemini-3.5-flash-lite",
                    "gemini-3.5-flash"
                ]
            );


        const hint =
            response.text
                ? response.text.trim()
                : "";


        if (!hint) {

            throw new Error(
                "AI did not generate a hint"
            );

        }


        return hint;

    } catch (error) {

        console.error(
            "AI hint generation error:",
            error
        );

        throw error;

    }
};


/* =========================================================
   GENERATE AI STUDY NOTES
========================================================= */
const generateStudyNotes = async (
    topic,
    difficulty = "Medium",
    noteLength = "Medium"
) => {

    const prompt = `
You are an AI study assistant.

Create clear and educational study notes for the following topic.

Topic: ${topic}
Difficulty: ${difficulty}
Note Length: ${noteLength}

NOTE REQUIREMENTS
=================

1. Start with a clear title.
2. Give a simple introduction to the topic.
3. Explain the important concepts.
4. Use headings and subheadings.
5. Use bullet points for important information.
6. Include simple examples where useful.
7. Include important definitions.
8. Include key points for quick revision.
9. Keep the explanation suitable for the requested difficulty.
10. Do not include incorrect or unrelated information.
11. Make the notes easy for a student to read and understand.

NOTE LENGTH
===========

Short:
- Brief notes.
- Focus only on the most important concepts.

Medium:
- Balanced explanation.
- Include important concepts, examples and quick revision points.

Detailed:
- Thorough explanation.
- Include concepts, examples, practical points and quick revision.

IMPORTANT
=========

Return only valid JSON.

The JSON must contain:
- title
- content

The content should be plain text.
Use headings and bullet points inside the content.
Do not use Markdown code blocks.
`;

    try {

        const response =
            await generateWithRetry(
                {
                    contents: prompt,

                    config: {
                        responseMimeType:
                            "application/json",

                        responseSchema: {
                            type: "object",

                            properties: {
                                title: {
                                    type: "string"
                                },

                                content: {
                                    type: "string"
                                }
                            },

                            required: [
                                "title",
                                "content"
                            ]
                        }
                    }
                },

                [
                    "gemini-3.6-flash",
                    "gemini-3.5-flash-lite",
                    "gemini-3.5-flash"
                ]
            );


        const text =
            response.text
                ? response.text.trim()
                : "";


        if (!text) {

            throw new Error(
                "AI did not return study notes"
            );

        }


        const notes =
            JSON.parse(text);


        if (
            !notes.title ||
            !notes.content
        ) {

            throw new Error(
                "Invalid study notes format received from AI"
            );

        }


        return notes;

    } catch (error) {

        console.error(
            "AI study notes generation error:",
            error
        );

        throw error;

    }
};


/* =========================================================
   EXPORT FUNCTIONS
========================================================= */

module.exports = {
    generateQuiz,
    generateHint,
    generateStudyNotes
};