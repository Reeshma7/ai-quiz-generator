import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/Profile.css";

function Profile() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        dateOfBirth: "",
        gender: ""
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // =================================
    // GET PROFILE
    // =================================

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token");

                if (!token) {
                    navigate("/login");
                    return;
                }

                const response = await API.get("/auth/profile", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const profile = response.data.user;

                setUser(profile);

                setFormData({
                    name: profile.name || "",
                    phone: profile.phone || "",
                    dateOfBirth: profile.dateOfBirth
                        ? profile.dateOfBirth.substring(0, 10)
                        : "",
                    gender: profile.gender || ""
                });
            } catch (error) {
                console.error("Profile error:", error);

                if (error.response?.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");

                    navigate("/login");
                } else {
                    setError(
                        error.response?.data?.message ||
                        "Unable to load profile"
                    );
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    // =================================
    // HANDLE CHANGE
    // =================================

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

        setError("");
        setSuccess("");
    };

    // =================================
    // UPDATE PROFILE
    // =================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        // Basic validation
        if (
            !formData.name.trim() ||
            !formData.phone.trim() ||
            !formData.dateOfBirth ||
            !formData.gender
        ) {
            setError("All fields are required.");
            return;
        }

        if (formData.name.trim().length < 3) {
            setError("Name must contain at least 3 characters.");
            return;
        }

        if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
            setError("Please enter a valid 10-digit phone number.");
            return;
        }

        try {
            setSaving(true);

            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            const response = await API.put(
                "/auth/profile",
                {
                    ...formData,
                    name: formData.name.trim(),
                    phone: formData.phone.trim()
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const updatedUser = response.data.user;

            setUser(updatedUser);

            // Update localStorage
            localStorage.setItem(
                "user",
                JSON.stringify(updatedUser)
            );

            // Tell Navbar about updated user
            window.dispatchEvent(new Event("authChange"));

            setSuccess("Profile updated successfully!");
        } catch (error) {
            console.error("Update profile error:", error);

            if (error.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");

                navigate("/login");
                return;
            }

            setError(
                error.response?.data?.message ||
                "Unable to update profile"
            );
        } finally {
            setSaving(false);
        }
    };

    // =================================
    // LOADING
    // =================================

    if (loading) {
        return (
            <div className="profile-loading">
                <div className="profile-spinner"></div>

                <h2>Loading Profile...</h2>

                <p>Please wait a moment.</p>
            </div>
        );
    }

    // =================================
    // PAGE
    // =================================

    return (
        <div className="profile-page">
            <div className="profile-background">
                <div className="profile-glow profile-glow-one"></div>
                <div className="profile-glow profile-glow-two"></div>
            </div>

            <div className="profile-container">
                {/* Header */}
                <div className="profile-header">
                    <div className="profile-avatar">
                        {user?.name
                            ? user.name.charAt(0).toUpperCase()
                            : "U"}
                    </div>

                    <div>
                        <span className="profile-badge">
                            MY PROFILE
                        </span>

                        <h1>
                            Hello, <span>{user?.name}</span>
                        </h1>

                        <p>
                            Manage your personal information
                            and account details.
                        </p>
                    </div>
                </div>

                {/* Card */}
                <div className="profile-card">
                    <div className="profile-card-header">
                        <div>
                            <h2>Personal Information</h2>

                            <p>
                                Update your profile details below.
                            </p>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="profile-error">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Success */}
                    {success && (
                        <div className="profile-success">
                            ✓ {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Name */}
                        <div className="profile-form-group">
                            <label htmlFor="name">
                                Full Name
                            </label>

                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                            />
                        </div>

                        {/* Email */}
                        <div className="profile-form-group">
                            <label htmlFor="email">
                                Email Address
                            </label>

                            <input
                                type="email"
                                id="email"
                                value={user?.email || ""}
                                disabled
                            />

                            <small>
                                Email address cannot be changed.
                            </small>
                        </div>

                        {/* Phone */}
                        <div className="profile-form-group">
                            <label htmlFor="phone">
                                Phone Number
                            </label>

                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Enter 10-digit phone number"
                                maxLength="10"
                            />
                        </div>

                        {/* DOB */}
                        <div className="profile-form-group">
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
                        <div className="profile-form-group">
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
                                    Select Gender
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

                        {/* Buttons */}
                        <div className="profile-actions">
                            <button
                                type="button"
                                className="profile-cancel"
                                onClick={() => navigate("/home")}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="profile-save"
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <span className="profile-button-spinner"></span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        Save Changes
                                        <span>→</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Profile;