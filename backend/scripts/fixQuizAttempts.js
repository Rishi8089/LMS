import mongoose from 'mongoose';
import Enrollment from '../models/EnrollmentsModel.js';
import connectDB from '../config/connectDB.js';

const fixQuizAttempts = async () => {
    try {
        await connectDB();

        // Find all enrollments where quizAttempts is not an array
        const enrollments = await Enrollment.find({
            $or: [
                { quizAttempts: { $type: 'number' } },
                { quizAttempts: { $type: 'string' } },
                { quizAttempts: { $type: 'bool' } },
                { quizAttempts: { $exists: false } }
            ]
        });

        console.log(`Found ${enrollments.length} enrollments with invalid quizAttempts`);

        for (const enrollment of enrollments) {
            enrollment.quizAttempts = [];
            await enrollment.save();
            console.log(`Fixed enrollment ${enrollment._id}`);
        }

        console.log('All enrollments fixed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing quizAttempts:', error);
        process.exit(1);
    }
};

fixQuizAttempts();
