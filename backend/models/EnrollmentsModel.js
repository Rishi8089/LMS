import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    enrollmentDate: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['enrolled', 'in-progress', 'completed'],
        default: 'enrolled'
    },
    progress: {
        type: Number,
        default: 0 // Overall progress percentage
    },
    quizCompleted: {
        type: Boolean,
        default: false
    },
    quizAttempts: [{
        score: {
            type: Number,
            required: true
        },
        passed: {
            type: Boolean,
            required: true
        },
        submittedAt: {
            type: Date,
            default: Date.now
        }
    }],
    lessonProgress: [{
        chapterIndex: { type: Number, required: true },
        lessonIndex: { type: Number, required: true },
        progress: { type: Number, default: 0 }, // 0-100
        completed: { type: Boolean, default: false },
        assessmentScore: { type: Number, default: null } // Score for lesson assessment
    }],
    lastAccessed: {
        type: Date,
        default: Date.now
    }
});

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

export default Enrollment;
