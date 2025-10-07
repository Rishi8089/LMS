import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/connectDB.js';
import cookieParser from 'cookie-parser';
import authRoute from './routes/authRoute.js';
import courseRoute from './routes/courseRoute.js';
import employeeRoute from './routes/employeeRoute.js';
import adminRoute from './routes/adminRoute.js';
import cors from 'cors';
dotenv.config();



const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
}));

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectDB();
});


//Employee Routes


app.use('/api/auth', authRoute);
app.use('/api/courses', courseRoute);
app.use('/api/employee', employeeRoute);


//Admin Routes

app.use('/api/admin', adminRoute);

app.get('/', (req, res) => {
    res.send("API is running");
});
