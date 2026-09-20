import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/Auth.css";

function Login() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!formData.email || !formData.password) {
            setError("Please enter email and password.");
            return;
        }

        try {
            setLoading(true);

            // Send login request using the shared API configuration
            const response = await API.post("/auth/login", formData);

            console.log("Login response:", response.data);

            // Save token
            localStorage.setItem("token", response.data.token);

            // Save user details
            if (response.data.user) {
                localStorage.setItem(
                    "user",
                    JSON.stringify(response.data.user)
                );
            }

            console.log(
                "Token saved:",
                !!localStorage.getItem("token")
            );

            navigate("/dashboard");
        } catch (error) {
            console.error("Login error:", error);

            setError(
                error.response?.data?.message ||
                "Invalid email or password."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-background">
                <div className="auth-glow auth-glow-one"></div>
                <div className="auth-glow auth-glow-two"></div>
            </div>

            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo">
                            🧠
                        </div>

                        <span className="auth-badge">
                            AI QUIZ GENERATOR
                        </span>

                        <h1>
                            Welcome <span>Back</span>
                        </h1>

                        <p>
                            Login to continue your quiz journey.
                        </p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
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

                        <div className="auth-form-group">
                            <label htmlFor="password">
                                Password
                            </label>

                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>

                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="auth-spinner"></span>
                                    Logging in...
                                </>
                            ) : (
                                <>
                                    Login
                                    <span>→</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Don't have an account?
                        </p>

                        <Link to="/register">
                            Create an account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;