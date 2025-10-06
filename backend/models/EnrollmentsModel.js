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
    status: {
        type: String,   
        enum: ['enrolled', 'progress', 'completed'],
        default: 'enrolled'
    }
});

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

export default Enrollment;