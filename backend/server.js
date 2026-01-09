import path from "path";
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/connectDB.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "passport";
import { Strategy as MicrosoftStrategy } from "passport-microsoft";
import cron from "node-cron";

import authRoute from "./routes/authRoute.js";
import courseRoute from "./routes/courseRoute.js";
import employeeRoute from "./routes/employeeRoute.js";
import adminRoute from "./routes/adminRoute.js";

import Employee from "./models/EmployeeModel.js";
import Course from "./models/CourseModel.js";
import Enrollment from "./models/EnrollmentsModel.js";
import { checkAndSendDueDateReminders } from "./services/emailService.js";

dotenv.config();

const app = express();

// ================== Middleware ==================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

// ================== DB ==================
connectDB();

// ================== Passport ==================
app.use(passport.initialize());

// ================== Microsoft OAuth Strategy ==================
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use(
    new MicrosoftStrategy(
      {
        clientID: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        callbackURL: "http://localhost:8000/api/auth/microsoft/callback",
        scope: "user.read",
        prompt: 'select_account',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const employee = await Employee.findOneAndUpdate(
            { ssoProvider: "microsoft", ssoId: profile.id },
            {
              $setOnInsert: {
                name: profile.displayName,
                email: profile.emails?.[0]?.value,
                password: null,
                phone: "",
                image: "",
                isSSOUser: true,
                ssoProvider: "microsoft",
                ssoId: profile.id,
              },
            },
            { new: true, upsert: true }
          );

          // 🔹 Auto-enroll mandatory courses ONLY for new users
          if (employee.isNew) {
            const mandatoryCourses = await Course.find({ mandatory: true });

            if (mandatoryCourses.length > 0) {
              const dueDate = new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              );

              await Enrollment.insertMany(
                mandatoryCourses.map((course) => ({
                  employee: employee._id,
                  course: course._id,
                  dueDate,
                  status: "enrolled",
                  progress: 0,
                  quizCompleted: false,
                  lessonProgress: [],
                  lastAccessed: new Date()
                }))
              );

              console.log(`Auto-enrolled SSO user ${employee.name} in ${mandatoryCourses.length} mandatory courses`);
            }
          }

          return done(null, employee);
        } catch (error) {
          console.error("Microsoft OAuth error:", error);
          return done(error, null);
        }
      }
    )
  );
} else {
  console.warn("Microsoft OAuth credentials not found. SSO disabled.");
}

// ================== Static Files ==================
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ================== Routes ==================
app.use("/api/auth", authRoute);
app.use("/api/courses", courseRoute);
app.use("/api/employee", employeeRoute);
app.use("/api/admin", adminRoute);

// ================== Health ==================
app.get("/", (req, res) => {
  res.send("API is running");
}); 

// ================== Cron Job ==================
cron.schedule("00 09 * * *", async () => {
  console.log("Running daily due date reminder check...");
  await checkAndSendDueDateReminders();
});

// ================== Server ==================
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
