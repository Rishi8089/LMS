import express from 'express';
// import { login , logout ,signUp } from '../controllers/authController.js';
import { login, register, logout, me } from "../controllers/authController.js";
import isAuth from '../middleware/isAuth.js';


const authRoute = express.Router();

authRoute.post('/login', login);
authRoute.get('/logout', logout);
authRoute.post("/register", register);
authRoute.get('/me', isAuth , me);

export default authRoute;





