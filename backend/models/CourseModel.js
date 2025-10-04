import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
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
    images: {
        type: String,
        required: false,
        default: ""
    },
    
   
    
}, { timestamps: true });



const Course = mongoose.model('Course', CourseSchema);

export default Course;



//  studentsEnrolled: [{
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Employee"
//     }],
//     chapters: [{
//         title: {
//             type: String,
//             required: false
//         },
//         minutes: {
//             type: Number,
//             required: false
//         }
        
//     }]