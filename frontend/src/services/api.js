import axios from "axios";

const API = axios.create({
    baseURL: "https://ai-quiz-generator-backend-ve4u.onrender.com/api"
});

export default API;