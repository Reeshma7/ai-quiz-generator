import { NavLink, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/Navbar.css";

function Navbar() {
    const navigate = useNavigate();

    const [isLoggedIn, setIsLoggedIn] = useState(
        !!localStorage.getItem("token")
    );

    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const checkLogin = () => {
            setIsLoggedIn(!!localStorage.getItem("token"));
        };

        window.addEventListener("storage", checkLogin);
        window.addEventListener("authChange", checkLogin);

        return () => {
            window.removeEventListener("storage", checkLogin);
            window.removeEventListener("authChange", checkLogin);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setIsLoggedIn(false);
        setMenuOpen(false);

        navigate("/login");
    };

    const handleLinkClick = () => {
        setMenuOpen(false);
    };

    const toggleMenu = () => {
        setMenuOpen((prev) => !prev);
    };

    const navLinkClass = ({ isActive }) =>
        isActive ? "nav-link active" : "nav-link";

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link
                    to="/"
                    className="navbar-logo"
                    onClick={handleLinkClick}
                >
                    AI Quiz Generator
                </Link>

                {isLoggedIn && (
                    <button
                        type="button"
                        className={`navbar-menu-button ${
                            menuOpen ? "open" : ""
                        }`}
                        onClick={toggleMenu}
                        aria-label="Toggle navigation menu"
                        aria-expanded={menuOpen}
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                )}

                <div
                    className={`navbar-links ${
                        menuOpen ? "mobile-menu-open" : ""
                    }`}
                >
                    {isLoggedIn && (
                        <>
                            <NavLink
                                to="/dashboard"
                                className={navLinkClass}
                                onClick={handleLinkClick}
                            >
                                Dashboard
                            </NavLink>

                            <NavLink
                                to="/generate"
                                className={navLinkClass}
                                onClick={handleLinkClick}
                            >
                                Generate Quiz
                            </NavLink>

                            <NavLink
                                to="/study-notes"
                                className={navLinkClass}
                                onClick={handleLinkClick}
                            >
                                AI Study Notes
                            </NavLink>

                            <NavLink
                                to="/history"
                                className={navLinkClass}
                                onClick={handleLinkClick}
                            >
                                History
                            </NavLink>

                            <NavLink
                                to="/profile"
                                className={navLinkClass}
                                onClick={handleLinkClick}
                            >
                                Profile
                            </NavLink>

                            <button
                                type="button"
                                className="navbar-logout"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;