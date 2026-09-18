import { Link } from "react-router-dom";
import "../styles/Home.css";

function Home() {
    return (
        <div className="home-page">

            {/* Hero Section */}
            <section className="hero-section">

                <div className="hero-background">
                    <div className="glow glow-one"></div>
                    <div className="glow glow-two"></div>
                </div>

                <div className="hero-content">

                    <div className="hero-badge">
                        ✨ AI-Powered Learning
                    </div>

                    <h1>
                        Learn Smarter.
                        <span> Quiz Better.</span>
                    </h1>

                    <p>
                        Create personalized quizzes instantly with
                        Artificial Intelligence. Choose your topic,
                        difficulty, and challenge yourself.
                    </p>

                    <div className="hero-buttons">
                        <Link
                            to="/generate"
                            className="primary-button"
                        >
                            Generate Your Quiz
                            <span>→</span>
                        </Link>

                        <Link
                            to="/history"
                            className="secondary-button"
                        >
                            View History
                        </Link>
                    </div>

                    <div className="hero-stats">
                        <div>
                            <strong>AI</strong>
                            <span>Powered</span>
                        </div>

                        <div>
                            <strong>∞</strong>
                            <span>Questions</span>
                        </div>

                        <div>
                            <strong>3</strong>
                            <span>Difficulty Levels</span>
                        </div>
                    </div>

                </div>

            </section>


            {/* Features Section */}
            <section className="features-section">

                <div className="section-heading">
                    <span>WHY CHOOSE US</span>
                    <h2>Everything you need to learn better</h2>
                    <p>
                        A simple and intelligent way to practice,
                        test your knowledge, and track your progress.
                    </p>
                </div>


                <div className="features-grid">

                    <div className="feature-card">
                        <div className="feature-icon">
                            🤖
                        </div>

                        <h3>AI Powered</h3>

                        <p>
                            Generate unique quiz questions automatically
                            using Artificial Intelligence.
                        </p>
                    </div>


                    <div className="feature-card">
                        <div className="feature-icon">
                            🎯
                        </div>

                        <h3>Personalized</h3>

                        <p>
                            Select your topic, difficulty level and
                            number of questions.
                        </p>
                    </div>


                    <div className="feature-card">
                        <div className="feature-icon">
                            📊
                        </div>

                        <h3>Track Results</h3>

                        <p>
                            Review your scores and keep track of your
                            quiz history.
                        </p>
                    </div>


                    <div className="feature-card">
                        <div className="feature-icon">
                            ⚡
                        </div>

                        <h3>Instant Quizzes</h3>

                        <p>
                            Get a complete quiz generated within seconds
                            and start learning immediately.
                        </p>
                    </div>

                </div>

            </section>


            {/* CTA Section */}
            <section className="cta-section">

                <div className="cta-content">

                    <div>
                        <span>READY TO TEST YOUR KNOWLEDGE?</span>

                        <h2>
                            Your next challenge is one click away.
                        </h2>
                    </div>

                    <Link
                        to="/generate"
                        className="cta-button"
                    >
                        Start Quiz →
                    </Link>

                </div>

            </section>


            {/* Footer */}
            <footer className="home-footer">

                <div>
                    <h3>🧠 AI Quiz Generator</h3>
                    <p>
                        Learn. Practice. Improve.
                    </p>
                </div>

                <p className="copyright">
                    © 2026 AI Quiz Generator. All rights reserved.
                </p>

            </footer>

        </div>
    );
}

export default Home;