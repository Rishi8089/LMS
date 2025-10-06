import express from 'express';
import {dashboard,adminLogin} from '../controllers/adminController.js';

const adminRoute = express.Router();

adminRoute.get('/dashboard', dashboard);


export default adminRoute;