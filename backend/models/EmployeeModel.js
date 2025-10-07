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
        required: false,
        default: ""
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
    enrolledCourses: [
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: false
    },
    enrollmentDate: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['enrolled', 'completed'],
      default: 'enrolled'
    },
    progress: {
      type: Number,
      default:0
    }
  }
]

}, { timestamps: true });

const Employee = mongoose.model('Employee', EmployeeSchema);

export default Employee;