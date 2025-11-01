import express from 'express';
// Ensure your import paths are correct based on your file structure
import { login, register, logout, me, check } from "../controllers/authController.js";
import { isAuth } from '../middleware/isAuth.js';


const authRoute = express.Router();

// Route for user login (typically POST)
authRoute.post('/login', login);

// Route for user registration/signup (typically POST)
authRoute.post("/register", register);

// Route for user logout (POST is a better practice)
authRoute.post('/logout', logout);

// Route to check authentication status
authRoute.get('/check', check);


export default authRoute;
