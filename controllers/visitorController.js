const visitorService = require('../services/visitorService');
const PDFDocument = require('pdfkit');

// Create visitor
const createVisitor = async (req, res) => {
    try {
        const visitorData = {
            ...req.body,
            createdBy: req.user._id
        };
        if (req.file) {
            visitorData.photo = req.file.filename;
        }
        const visitor = await visitorService.createVisitor(visitorData);
        res.status(201).json({
            message: 'Visitor registered successfully !!',
            visitor
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all visitors
const getAllVisitors = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.host) filter.host = req.query.host;
        if (req.user.role === 'employee') filter.host = req.user._id;

        const visitors = await visitorService.getAllVisitors(filter);
        res.status(200).json(visitors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single visitor
const getVisitorById = async (req, res) => {
    try {
        const visitor = await visitorService.getVisitorById(req.params.id);
        res.status(200).json(visitor);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Update visitor
const updateVisitor = async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (req.file) {
            updateData.photo = req.file.filename;
        }
        const visitor = await visitorService.updateVisitor(req.params.id, updateData);
        res.status(200).json({
            message: 'Visitor updated successfully !!',
            visitor
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Approve visitor
const approveVisitor = async (req, res) => {
    try {
        const visitor = await visitorService.approveVisitor(req.params.id);
        res.status(200).json({
            message: 'Visitor approved successfully !!',
            visitor
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Check-in visitor
const checkInVisitor = async (req, res) => {
    try {
        const { passCode } = req.body;
        if (!passCode) {
            return res.status(400).json({ message: 'Pass code is required' });
        }
        const visitor = await visitorService.checkInVisitor(passCode);
        res.status(200).json({
            message: 'Visitor checked in successfully !!',
            visitor
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Check-out visitor
const checkOutVisitor = async (req, res) => {
    try {
        const { passCode } = req.body;
        if (!passCode) {
            return res.status(400).json({ message: 'Pass code is required' });
        }
        const visitor = await visitorService.checkOutVisitor(passCode);
        res.status(200).json({
            message: 'Visitor checked out successfully !!',
            visitor
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete visitor
const deleteVisitor = async (req, res) => {
    try {
        const visitor = await visitorService.deleteVisitor(req.params.id);
        res.status(200).json({
            message: 'Visitor deleted successfully !!',
            visitor
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Dashboard stats
const getDashboardStats = async (req, res) => {
    try {
        const stats = await visitorService.getDashboardStats();
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Generate PDF Badge
const generatePDF = async (req, res) => {
    try {
        const visitor = await visitorService.getVisitorById(req.params.id);

        const doc = new PDFDocument({ size: [400, 550], margin: 30 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=visitor-pass-${visitor.passCode}.pdf`);

        doc.pipe(res);

        // Header background
        doc.rect(0, 0, 400, 80).fill('#e94560');
        doc.fontSize(22).fill('#ffffff').text('VISITOR PASS', 0, 25, { align: 'center' });
        doc.fontSize(10).fill('#ffffff').text('Visitor Pass Management System', 0, 52, { align: 'center' });

        // Status badge
        const statusColor = visitor.status === 'approved' ? '#4ecca3' : visitor.status === 'checked-in' ? '#2196f3' : '#ffc107';
        doc.rect(140, 90, 120, 25).fill(statusColor);
        doc.fontSize(11).fill('#ffffff').text(visitor.status.toUpperCase(), 140, 96, { width: 120, align: 'center' });

        // Visitor details
        doc.fill('#333333');
        let y = 135;

        doc.fontSize(18).text(visitor.name, 30, y, { align: 'center' });
        y += 35;

        doc.fontSize(10).fill('#888888').text('COMPANY', 30, y);
        doc.fontSize(12).fill('#333333').text(visitor.company || 'N/A', 30, y + 14);
        y += 40;

        doc.fontSize(10).fill('#888888').text('PURPOSE OF VISIT', 30, y);
        doc.fontSize(12).fill('#333333').text(visitor.purpose, 30, y + 14);
        y += 40;

        doc.fontSize(10).fill('#888888').text('HOST', 30, y);
        doc.fontSize(12).fill('#333333').text(visitor.host?.name || 'N/A', 30, y + 14);
        y += 40;

        doc.fontSize(10).fill('#888888').text('PHONE', 30, y);
        doc.fontSize(12).fill('#333333').text(visitor.phone, 30, y + 14);
        y += 40;

        doc.fontSize(10).fill('#888888').text('EXPECTED DATE', 30, y);
        doc.fontSize(12).fill('#333333').text(new Date(visitor.expectedDate).toLocaleDateString(), 30, y + 14);
        y += 40;

        // Pass Code
        doc.rect(30, y, 340, 40).fill('#f0f0f0');
        doc.fontSize(10).fill('#888888').text('PASS CODE', 30, y + 5, { width: 340, align: 'center' });
        doc.fontSize(16).fill('#e94560').text(visitor.passCode, 30, y + 18, { width: 340, align: 'center' });
        y += 55;

        // QR Code
        if (visitor.qrCode) {
            const base64Data = visitor.qrCode.replace(/^data:image\/png;base64,/, '');
            const qrBuffer = Buffer.from(base64Data, 'base64');
            doc.image(qrBuffer, 140, y, { width: 120, height: 120 });
            y += 125;
            doc.fontSize(8).fill('#888888').text('Scan QR Code for verification', 30, y, { width: 340, align: 'center' });
        }

        // Footer
        doc.rect(0, 520, 400, 30).fill('#1a1a2e');
        doc.fontSize(8).fill('#ffffff').text('Generated by Visitor Pass Management System', 0, 530, { align: 'center' });

        doc.end();
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
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
    getDashboardStats,
    generatePDF
};
