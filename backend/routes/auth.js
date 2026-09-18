const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const protect = require("../middleware/authMiddleware");

const router = express.Router();


// ======================================================
// REGISTER
// ======================================================

router.post("/register", async (req, res) => {

    try {

        const {
            name,
            email,
            phone,
            dateOfBirth,
            gender,
            password
        } = req.body;


        // ------------------------------------------
        // REQUIRED FIELDS
        // ------------------------------------------

        if (
            !name ||
            !email ||
            !phone ||
            !dateOfBirth ||
            !gender ||
            !password
        ) {

            return res.status(400).json({
                message: "All fields are required"
            });

        }


        // ------------------------------------------
        // NAME
        // ------------------------------------------

        const cleanName = name.trim();

        if (cleanName.length < 3) {

            return res.status(400).json({
                message:
                    "Name must contain at least 3 characters"
            });

        }


        // ------------------------------------------
        // EMAIL
        // ------------------------------------------

        const cleanEmail =
            email.trim().toLowerCase();

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(cleanEmail)) {

            return res.status(400).json({
                message:
                    "Please enter a valid email address"
            });

        }


        // ------------------------------------------
        // PHONE
        // ------------------------------------------

        const cleanPhone = phone.trim();

        if (!/^[6-9]\d{9}$/.test(cleanPhone)) {

            return res.status(400).json({
                message:
                    "Please enter a valid 10-digit phone number"
            });

        }


        // ------------------------------------------
        // DATE OF BIRTH
        // ------------------------------------------

        const dob = new Date(dateOfBirth);

        if (isNaN(dob.getTime())) {

            return res.status(400).json({
                message:
                    "Please enter a valid date of birth"
            });

        }


        if (dob > new Date()) {

            return res.status(400).json({
                message:
                    "Date of birth cannot be in the future"
            });

        }


        // ------------------------------------------
        // GENDER
        // ------------------------------------------

        const validGenders = [
            "Male",
            "Female",
            "Other",
            "Prefer not to say"
        ];

        if (!validGenders.includes(gender)) {

            return res.status(400).json({
                message:
                    "Please select a valid gender"
            });

        }


        // ------------------------------------------
        // PASSWORD
        // ------------------------------------------

        if (password.length < 8) {

            return res.status(400).json({
                message:
                    "Password must contain at least 8 characters"
            });

        }

        if (!/[A-Z]/.test(password)) {

            return res.status(400).json({
                message:
                    "Password must contain at least one uppercase letter"
            });

        }

        if (!/[a-z]/.test(password)) {

            return res.status(400).json({
                message:
                    "Password must contain at least one lowercase letter"
            });

        }

        if (!/[0-9]/.test(password)) {

            return res.status(400).json({
                message:
                    "Password must contain at least one number"
            });

        }


        // ------------------------------------------
        // CHECK EXISTING USER
        // ------------------------------------------

        const existingUser =
            await User.findOne({
                email: cleanEmail
            });

        if (existingUser) {

            return res.status(400).json({
                message:
                    "User already exists with this email"
            });

        }


        // ------------------------------------------
        // HASH PASSWORD
        // ------------------------------------------

        const hashedPassword =
            await bcrypt.hash(password, 10);


        // ------------------------------------------
        // CREATE USER
        // ------------------------------------------

        const user = new User({
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
            dateOfBirth: dob,
            gender,
            password: hashedPassword
        });


        // ------------------------------------------
        // SAVE
        // ------------------------------------------

        await user.save();


        // ------------------------------------------
        // RESPONSE
        // ------------------------------------------

        return res.status(201).json({
            message: "Registration successful"
        });

    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        if (error.code === 11000) {

            return res.status(400).json({
                message:
                    "User already exists with this email"
            });

        }

        return res.status(500).json({
            message: "Server error"
        });
    }
});


// ======================================================
// LOGIN
// ======================================================

router.post("/login", async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        // ------------------------------------------
        // REQUIRED FIELDS
        // ------------------------------------------

        if (!email || !password) {

            return res.status(400).json({
                message:
                    "Email and password are required"
            });

        }


        // ------------------------------------------
        // CLEAN EMAIL
        // ------------------------------------------

        const cleanEmail =
            email.trim().toLowerCase();


        // ------------------------------------------
        // FIND USER
        // ------------------------------------------

        const user =
            await User.findOne({
                email: cleanEmail
            });

        if (!user) {

            return res.status(401).json({
                message:
                    "Invalid email or password"
            });

        }


        // ------------------------------------------
        // CHECK PASSWORD
        // ------------------------------------------

        const isMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!isMatch) {

            return res.status(401).json({
                message:
                    "Invalid email or password"
            });

        }


        // ------------------------------------------
        // CHECK JWT SECRET
        // ------------------------------------------

        if (!process.env.JWT_SECRET) {

            console.error(
                "JWT_SECRET is missing in .env"
            );

            return res.status(500).json({
                message:
                    "JWT secret is not configured"
            });

        }


        // ------------------------------------------
        // CREATE TOKEN
        // ------------------------------------------

        const token =
            jwt.sign(
                {
                    userId: user._id.toString()
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "1d"
                }
            );


        // ------------------------------------------
        // RESPONSE
        // ------------------------------------------

        return res.status(200).json({

            message: "Login successful",

            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                dateOfBirth: user.dateOfBirth,
                gender: user.gender
            }

        });

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
});


// ======================================================
// GET LOGGED-IN USER PROFILE
// ======================================================

router.get(
    "/profile",
    protect,
    async (req, res) => {

        try {

            const user = req.user;

            return res.status(200).json({

                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    dateOfBirth: user.dateOfBirth,
                    gender: user.gender,
                    createdAt: user.createdAt
                }

            });

        } catch (error) {

            console.error(
                "Get profile error:",
                error
            );

            return res.status(500).json({
                message: "Server error"
            });
        }
    }
);


// ======================================================
// UPDATE PROFILE
// ======================================================

router.put(
    "/profile",
    protect,
    async (req, res) => {

        try {

            const {
                name,
                phone,
                dateOfBirth,
                gender
            } = req.body;


            // ------------------------------------------
            // REQUIRED
            // ------------------------------------------

            if (
                !name ||
                !phone ||
                !dateOfBirth ||
                !gender
            ) {

                return res.status(400).json({
                    message:
                        "All profile fields are required"
                });

            }


            // ------------------------------------------
            // NAME
            // ------------------------------------------

            const cleanName = name.trim();

            if (cleanName.length < 3) {

                return res.status(400).json({
                    message:
                        "Name must contain at least 3 characters"
                });

            }


            // ------------------------------------------
            // PHONE
            // ------------------------------------------

            const cleanPhone = phone.trim();

            if (!/^[6-9]\d{9}$/.test(cleanPhone)) {

                return res.status(400).json({
                    message:
                        "Please enter a valid 10-digit phone number"
                });

            }


            // ------------------------------------------
            // DATE
            // ------------------------------------------

            const dob = new Date(dateOfBirth);

            if (isNaN(dob.getTime())) {

                return res.status(400).json({
                    message:
                        "Please enter a valid date of birth"
                });

            }


            if (dob > new Date()) {

                return res.status(400).json({
                    message:
                        "Date of birth cannot be in the future"
                });

            }


            // ------------------------------------------
            // GENDER
            // ------------------------------------------

            const validGenders = [
                "Male",
                "Female",
                "Other",
                "Prefer not to say"
            ];

            if (!validGenders.includes(gender)) {

                return res.status(400).json({
                    message:
                        "Please select a valid gender"
                });

            }


            // ------------------------------------------
            // UPDATE
            // ------------------------------------------

            const updatedUser =
                await User.findByIdAndUpdate(

                    req.user._id,

                    {
                        name: cleanName,
                        phone: cleanPhone,
                        dateOfBirth: dob,
                        gender
                    },

                    {
                        new: true,
                        runValidators: true
                    }

                ).select("-password");


            if (!updatedUser) {

                return res.status(404).json({
                    message:
                        "User not found"
                });

            }


            // ------------------------------------------
            // RESPONSE
            // ------------------------------------------

            return res.status(200).json({

                message:
                    "Profile updated successfully",

                user: {
                    id: updatedUser._id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    phone: updatedUser.phone,
                    dateOfBirth:
                        updatedUser.dateOfBirth,
                    gender:
                        updatedUser.gender,
                    createdAt:
                        updatedUser.createdAt
                }

            });

        } catch (error) {

            console.error(
                "Update profile error:",
                error
            );

            return res.status(500).json({
                message: "Server error"
            });
        }
    }
);


module.exports = router;