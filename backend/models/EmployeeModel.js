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


}, { timestamps: true });

const Employee = mongoose.model('Employee', EmployeeSchema);

export default Employee;
