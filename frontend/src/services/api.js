import axios from "axios";

const API = axios.create({
    baseURL: "https://ai-quiz-generator-backend-sandy.vercel.app/api"
});

export default API;