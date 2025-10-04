import express from "express";
import { createCourse, deleteCourse, getCourses, getCourseById, updateCourse } from "../controllers/courseController.js";

const courseRoute = express.Router();

courseRoute.post("/create-course", createCourse);
courseRoute.get("/", getCourses);
courseRoute.get("/:id", getCourseById);
courseRoute.put("/update-course/:id", updateCourse);
courseRoute.delete("/delete-course/:id", deleteCourse);

export default courseRoute;