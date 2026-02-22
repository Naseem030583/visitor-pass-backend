const Visitor = require('../models/Visitor');
const QRCode = require('qrcode');
const crypto = require('crypto');

// Create a new visitor
const createVisitor = async (visitorData) => {
    const passCode = crypto.randomBytes(6).toString('hex');
    visitorData.passCode = passCode;

    const visitor = await Visitor.create(visitorData);

    // Generate QR code
    const qrData = JSON.stringify({
        id: visitor._id,
        passCode: passCode,
        name: visitor.name
    });
    const qrCode = await QRCode.toDataURL(qrData);
    visitor.qrCode = qrCode;
    await visitor.save();

    return visitor;
};

// Get all visitors
const getAllVisitors = async (filter = {}) => {
    return await Visitor.find(filter)
        .populate('host', 'name email department')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
};

// Get visitor by ID
const getVisitorById = async (id) => {
    const visitor = await Visitor.findById(id)
        .populate('host', 'name email department')
        .populate('createdBy', 'name email');
    if (!visitor) {
        throw new Error('Visitor not found');
    }
    return visitor;
};

// Update visitor
const updateVisitor = async (id, updateData) => {
    const visitor = await Visitor.findByIdAndUpdate(id, updateData, { new: true })
        .populate('host', 'name email department');
    if (!visitor) {
        throw new Error('Visitor not found');
    }
    return visitor;
};

// Approve visitor
const approveVisitor = async (id) => {
    return await updateVisitor(id, { status: 'approved' });
};

// Check-in visitor
const checkInVisitor = async (passCode) => {
    const visitor = await Visitor.findOne({ passCode });
    if (!visitor) {
        throw new Error('Invalid pass code');
    }
    if (visitor.status === 'checked-in') {
        throw new Error('Visitor already checked in');
    }
    if (visitor.status !== 'approved') {
        throw new Error('Visitor pass not approved yet');
    }

    visitor.status = 'checked-in';
    visitor.checkInTime = new Date();
    await visitor.save();

    return visitor;
};

// Check-out visitor
const checkOutVisitor = async (passCode) => {
    const visitor = await Visitor.findOne({ passCode });
    if (!visitor) {
        throw new Error('Invalid pass code');
    }
    if (visitor.status !== 'checked-in') {
        throw new Error('Visitor is not checked in');
    }

    visitor.status = 'checked-out';
    visitor.checkOutTime = new Date();
    await visitor.save();

    return visitor;
};

// Delete visitor
const deleteVisitor = async (id) => {
    const visitor = await Visitor.findByIdAndDelete(id);
    if (!visitor) {
        throw new Error('Visitor not found');
    }
    return visitor;
};

// Get dashboard stats
const getDashboardStats = async () => {
    const total = await Visitor.countDocuments();
    const pending = await Visitor.countDocuments({ status: 'pending' });
    const approved = await Visitor.countDocuments({ status: 'approved' });
    const checkedIn = await Visitor.countDocuments({ status: 'checked-in' });
    const checkedOut = await Visitor.countDocuments({ status: 'checked-out' });

    return { total, pending, approved, checkedIn, checkedOut };
};

module.exports = {
    createVisitor,
    getAllVisitors,
    getVisitorById,
    updateVisitor,
    approveVisitor,
    checkInVisitor,
    checkOutVisitor,
    deleteVisitor,
    getDashboardStats
};