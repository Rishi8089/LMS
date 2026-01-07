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
        required: function() { return !this.isSSOUser; } // Password optional for SSO users
    },
    image: {
        type: String,
        required: false,
        default: ""
    },
    // SSO Functionality
    isSSOUser: {
        type: Boolean,
        default: false
    },
    ssoProvider: {
        type: String,
        enum: ['microsoft', 'other'],
        required: false
    },
    ssoId: {
        type: String,
        required: false,
        unique: true,
        sparse: true
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
      default: 0,
      min: 0,
      max: 100
    },
    completedLessons: {
      type: Number,
      default: 0
    },
    totalLessons: {
      type: Number,
      default: 0
    },
    lessonProgress: [{
      chapterIndex: { type: Number, required: true },
      lessonIndex: { type: Number, required: true },
      progress: { type: Number, default: 0, min: 0, max: 100 }, // 0-100
      completed: { type: Boolean, default: false },
      lastAccessed: { type: Date, default: Date.now }
    }]
  }
]

}, { timestamps: true });

const Employee = mongoose.model('Employee', EmployeeSchema);

export default Employee;
