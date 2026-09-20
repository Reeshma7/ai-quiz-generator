import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/Auth.css";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        gender: "",
        password: "",
        confirmPassword: ""
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

        setError("");
        setSuccess("");
    };

    const validateForm = () => {
        const {
            name,
            email,
            phone,
            dateOfBirth,
            gender,
            password,
            confirmPassword
        } = formData;

        // Required fields
        if (
            !name ||
            !email ||
            !phone ||
            !dateOfBirth ||
            !gender ||
            !password ||
            !confirmPassword
        ) {
            return "Please fill in all fields.";
        }

        // Name validation
        if (name.trim().length < 3) {
            return "Name must contain at least 3 characters.";
        }

        if (!/^[A-Za-z ]+$/.test(name.trim())) {
            return "Name should contain only letters and spaces.";
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email.trim())) {
            return "Please enter a valid email address.";
        }

        // Phone validation
        if (!/^[6-9]\d{9}$/.test(phone)) {
            return "Please enter a valid 10-digit Indian mobile number.";
        }

        // Date validation
        const selectedDate = new Date(`${dateOfBirth}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (Number.isNaN(selectedDate.getTime()) || selectedDate >= today) {
            return "Date of birth must be in the past.";
        }

        // Password length
        if (password.length < 8) {
            return "Password must contain at least 8 characters.";
        }

        // Password uppercase
        if (!/[A-Z]/.test(password)) {
            return "Password must contain at least one uppercase letter.";
        }

        // Password lowercase
        if (!/[a-z]/.test(password)) {
            return "Password must contain at least one lowercase letter.";
        }

        // Password number
        if (!/[0-9]/.test(password)) {
            return "Password must contain at least one number.";
        }

        // Password special character
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            return "Password must contain at least one special character.";
        }

        // Confirm password
        if (password !== confirmPassword) {
            return "Passwords do not match.";
        }

        return "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        const validationError = validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setLoading(true);

            // Register using the shared API configuration
            const response = await API.post("/auth/register", {
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                phone: formData.phone,
                dateOfBirth: formData.dateOfBirth,
                gender: formData.gender,
                password: formData.password
            });

            setSuccess(
                response.data.message || "Registration successful!"
            );

            // Clear form
            setFormData({
                name: "",
                email: "",
                phone: "",
                dateOfBirth: "",
                gender: "",
                password: "",
                confirmPassword: ""
            });

            // Redirect to login after 1.5 seconds
            setTimeout(() => {
                navigate("/login");
            }, 1500);
        } catch (error) {
            console.error("Registration error:", error);

            setError(
                error.response?.data?.message ||
                "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* Background */}
            <div className="auth-background">
                <div className="auth-glow auth-glow-one"></div>
                <div className="auth-glow auth-glow-two"></div>
            </div>

            {/* Container */}
            <div className="auth-container">
                {/* Card */}
                <div className="auth-card">
                    {/* Header */}
                    <div className="auth-header">
                        <div className="auth-logo">
                            🧠
                        </div>

                        <span className="auth-badge">
                            AI QUIZ GENERATOR
                        </span>

                        <h1>
                            Create <span>Account</span>
                        </h1>

                        <p>
                            Create your account and start
                            your personalized quiz journey.
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="auth-error">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Success */}
                    {success && (
                        <div className="auth-success">
                            ✅ {success}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        {/* Name */}
                        <div className="auth-form-group">
                            <label htmlFor="name">
                                Full Name
                            </label>

                            <input
                                type="text"
                                id="name"
                                name="name"
                                placeholder="Enter your full name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Email */}
                        <div className="auth-form-group">
                            <label htmlFor="email">
                                Email Address
                            </label>

                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Phone */}
                        <div className="auth-form-group">
                            <label htmlFor="phone">
                                Phone Number
                            </label>

                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                placeholder="Enter 10-digit mobile number"
                                value={formData.phone}
                                onChange={handleChange}
                                maxLength={10}
                            />
                        </div>

                        {/* Date of Birth */}
                        <div className="auth-form-group">
                            <label htmlFor="dateOfBirth">
                                Date of Birth
                            </label>

                            <input
                                type="date"
                                id="dateOfBirth"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Gender */}
                        <div className="auth-form-group">
                            <label htmlFor="gender">
                                Gender
                            </label>

                            <select
                                id="gender"
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                            >
                                <option value="">
                                    Select gender
                                </option>

                                <option value="Male">
                                    Male
                                </option>

                                <option value="Female">
                                    Female
                                </option>

                                <option value="Other">
                                    Other
                                </option>

                                <option value="Prefer not to say">
                                    Prefer not to say
                                </option>
                            </select>
                        </div>

                        {/* Password */}
                        <div className="auth-form-group">
                            <label htmlFor="password">
                                Password
                            </label>

                            <div className="password-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    placeholder="Create a strong password"
                                    value={formData.password}
                                    onChange={handleChange}
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>

                            <small>
                                8+ characters, uppercase, lowercase,
                                number and special character.
                            </small>
                        </div>

                        {/* Confirm Password */}
                        <div className="auth-form-group">
                            <label htmlFor="confirmPassword">
                                Confirm Password
                            </label>

                            <div className="password-wrapper">
                                <input
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    placeholder="Confirm your password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword
                                        )
                                    }
                                >
                                    {showConfirmPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="auth-spinner"></span>
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    Create Account
                                    <span>→</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="auth-footer">
                        <p>
                            Already have an account?
                        </p>

                        <Link to="/login">
                            Login here
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;