import express from 'express';
// Ensure your import paths are correct based on your file structure
import { login, register, logout, me, check, microsoftAuth, microsoftAuthCallback } from "../controllers/authController.js";
import { isAuth } from '../middleware/isAuth.js';
import { sendDueDateReminder } from '../services/emailService.js';


const authRoute = express.Router();

// Route for user login (typically POST)
authRoute.post('/login', login);

// Route for user registration/signup (typically POST)
authRoute.post("/register", register);

// Route for user logout (POST is a better practice)
authRoute.post('/logout', logout);

// Route to check authentication status
authRoute.get('/check', check);

// Microsoft SSO routes
authRoute.get('/microsoft', microsoftAuth);
authRoute.get('/microsoft/callback', microsoftAuthCallback);

// Test email route
authRoute.post('/test-email', isAuth, async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email and name are required'
      });
    }

    // Send test email
    const success = await sendDueDateReminder(
      email,
      name,
      'Test Course',
      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
    );

    if (success) {
      res.json({
        success: true,
        message: 'Test email sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email'
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


export default authRoute;
