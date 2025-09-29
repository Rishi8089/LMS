import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: false,
        default: ""
    },
    enrolledCourses:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
    }]
}, { timestamps: true });

const Employee = mongoose.model('Employee', EmployeeSchema);

export default Employee;