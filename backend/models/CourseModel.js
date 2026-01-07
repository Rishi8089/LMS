import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    hours: {
        type: Number,
        required: true
    },
    difficulty: {
        type: String,
        required: true,
        enum: ["Beginner", "Intermediate", "Hard"]
    },
    mandatory: {
        type: Boolean,
        default: false
    },
    dueDate: { 
        type: Date, 
        required: false // ✅ ADDED: This was missing
    },
    images: {
        type: String,
        required: false,
        default: ""
    },
    chapters: [{
        title: {
            type: String,
            required: true
        },
        lessons: [{
            title: {
                type: String,
                required: true
            },
            // Note: Your controller currently saves all file URLs (video or PDF) to this 'video' field.
            video: {
                type: String, 
                required: false // Changed to false in case it's just text content
            },
            duration: {
                type: String,
                required: false,
                default: "0:00"
            },
            // You added this, but your current controller puts generic files in 'video'. 
            // You can keep it, but it might remain empty unless you update the controller.
            pdfUrl: {
                type: String,
                required: false
            }
        }]
    }],
    quiz: {
        title: { type: String, required: false },
        description: { type: String, required: false },
        timeLimitMins: { type: Number, default: 0 },
        maxAttempts: { type: Number, default: 1 },
        shuffleQuestions: { type: Boolean, default: false },
        shuffleOptions: { type: Boolean, default: false },
        passingPercentage: { type: Number, default: 0 },
        published: { type: Boolean, default: false },
        questions: [{
            text: {
                type: String,
                required: true
            },
            type: {
                type: String,
                enum: ["mcq_single", "mcq_multiple"],
                default: "mcq_single",
                required: true
            },
            options: [{
                type: String,
                required: true
            }],
            correctAnswers: [{
                type: String, // ✅ FIXED: Frontend sends Strings (e.g., "Option A"), not Numbers (indices)
                required: true
            }],
            marks: {
                type: Number,
                default: 1
            },
            explanation: {
                type: String,
                required: false
            }
        }]
    },
    totalDuration: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const Course = mongoose.model('Course', CourseSchema);

export default Course;