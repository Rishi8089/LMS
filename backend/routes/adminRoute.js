import express from 'express';
import { dashboard, adminLogin, employeeRegister, getAllEmployees } from '../controllers/adminController.js';

const adminRoute = express.Router();

adminRoute.get('/dashboard', dashboard);
adminRoute.post('/login', adminLogin);
adminRoute.post('/employee-register', employeeRegister);
adminRoute.get('/employees', getAllEmployees);

export default adminRoute;
