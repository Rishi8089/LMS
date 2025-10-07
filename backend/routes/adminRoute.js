import express from 'express';
import { dashboard, adminLogin, employeeRegister, getAllEmployees, adminCheck, adminLogout } from '../controllers/adminController.js';

const adminRoute = express.Router();

adminRoute.get('/dashboard', dashboard);
adminRoute.post('/login', adminLogin);
adminRoute.post('/employee-register', employeeRegister);
adminRoute.get('/employees', getAllEmployees);
adminRoute.get('/check', adminCheck);
adminRoute.post('/logout', adminLogout);

export default adminRoute;
