const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        default: ''
    },
    phone: {
        type: String,
        required: true
    },
    photo: {
        type: String,
        default: ''
    },
    company: {
        type: String,
        default: ''
    },
    purpose: {
        type: String,
        required: true
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'checked-in', 'checked-out', 'rejected'],
        default: 'pending'
    },
    checkInTime: {
        type: Date,
        default: null
    },
    checkOutTime: {
        type: Date,
        default: null
    },
    passCode: {
        type: String,
        default: ''
    },
    qrCode: {
        type: String,
        default: ''
    },
    expectedDate: {
        type: Date,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('Visitor', visitorSchema);