const visitorService = require('../services/visitorService');
const PDFDocument = require('pdfkit');

// Create visitor
const createVisitor = async (req, res) => {
    try {
        const visitorData = {
            ...req.body,
            createdBy: req.user._id
        };
        // Convert uploaded photo to base64 string and store in DB
        if (req.file) {
            const base64Photo = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
            visitorData.photo = base64Photo;
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
            const base64Photo = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
            updateData.photo = base64Photo;
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

// Generate PDF Badge - Single Page with Photo
const generatePDF = async (req, res) => {
    try {
        const visitor = await visitorService.getVisitorById(req.params.id);

        const doc = new PDFDocument({
            size: [350, 500],
            margins: { top: 0, bottom: 0, left: 0, right: 0 }
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=visitor-pass-${visitor.passCode}.pdf`);

        doc.pipe(res);

        // ---- HEADER ----
        doc.rect(0, 0, 350, 55).fill('#e94560');
        doc.fontSize(18).fill('#ffffff').text('VISITOR PASS', 0, 12, { align: 'center' });
        doc.fontSize(8).fill('#ffffff').text('Visitor Pass Management System', 0, 35, { align: 'center' });

        // ---- STATUS BADGE ----
        const statusColor = visitor.status === 'approved' ? '#4ecca3' : visitor.status === 'checked-in' ? '#2196f3' : visitor.status === 'checked-out' ? '#888888' : '#ffc107';
        doc.roundedRect(125, 62, 100, 18, 9).fill(statusColor);
        doc.fontSize(8).fill('#ffffff').text(visitor.status.toUpperCase(), 125, 66, { width: 100, align: 'center' });

        let y = 88;

        // ---- VISITOR PHOTO ----
        if (visitor.photo && visitor.photo.startsWith('data:image')) {
            try {
                const base64Data = visitor.photo.replace(/^data:image\/\w+;base64,/, '');
                const photoBuffer = Buffer.from(base64Data, 'base64');
                doc.save();
                doc.circle(175, y + 30, 32).clip();
                doc.image(photoBuffer, 143, y - 2, { width: 64, height: 64, fit: [64, 64] });
                doc.restore();
                doc.circle(175, y + 30, 32).lineWidth(2).stroke('#e94560');
                y += 70;
            } catch (photoErr) {
                // Skip photo if error
            }
        }

        // ---- VISITOR NAME ----
        doc.fontSize(14).fill('#333333').text(visitor.name, 20, y, { width: 310, align: 'center' });
        y += 22;

        // ---- DETAILS (compact two-column layout) ----
        const leftX = 25;
        const rightX = 185;
        const labelSize = 7;
        const valueSize = 9;
        const rowHeight = 28;

        // Row 1: Company | Purpose
        doc.fontSize(labelSize).fill('#888888').text('COMPANY', leftX, y);
        doc.fontSize(valueSize).fill('#333333').text(visitor.company || 'N/A', leftX, y + 10, { width: 140 });
        doc.fontSize(labelSize).fill('#888888').text('PURPOSE', rightX, y);
        doc.fontSize(valueSize).fill('#333333').text(visitor.purpose, rightX, y + 10, { width: 140 });
        y += rowHeight;

        // Row 2: Host | Phone
        doc.fontSize(labelSize).fill('#888888').text('HOST', leftX, y);
        doc.fontSize(valueSize).fill('#333333').text(visitor.host?.name || 'N/A', leftX, y + 10, { width: 140 });
        doc.fontSize(labelSize).fill('#888888').text('PHONE', rightX, y);
        doc.fontSize(valueSize).fill('#333333').text(visitor.phone, rightX, y + 10, { width: 140 });
        y += rowHeight;

        // Row 3: Date | Email
        doc.fontSize(labelSize).fill('#888888').text('EXPECTED DATE', leftX, y);
        doc.fontSize(valueSize).fill('#333333').text(new Date(visitor.expectedDate).toLocaleDateString(), leftX, y + 10, { width: 140 });
        doc.fontSize(labelSize).fill('#888888').text('EMAIL', rightX, y);
        doc.fontSize(valueSize).fill('#333333').text(visitor.email || 'N/A', rightX, y + 10, { width: 140 });
        y += rowHeight + 5;

        // ---- DIVIDER ----
        doc.moveTo(25, y).lineTo(325, y).lineWidth(0.5).stroke('#cccccc');
        y += 8;

        // ---- PASS CODE ----
        doc.roundedRect(75, y, 200, 28, 5).fill('#f0f0f0');
        doc.fontSize(7).fill('#888888').text('PASS CODE', 75, y + 3, { width: 200, align: 'center' });
        doc.fontSize(13).fill('#e94560').text(visitor.passCode, 75, y + 13, { width: 200, align: 'center' });
        y += 35;

        // ---- QR CODE ----
        if (visitor.qrCode) {
            const qrBase64 = visitor.qrCode.replace(/^data:image\/png;base64,/, '');
            const qrBuffer = Buffer.from(qrBase64, 'base64');
            const qrSize = 80;
            doc.image(qrBuffer, (350 - qrSize) / 2, y, { width: qrSize, height: qrSize });
            y += qrSize + 5;
            doc.fontSize(6).fill('#888888').text('Scan QR Code for verification', 0, y, { width: 350, align: 'center' });
        }

        // ---- FOOTER ----
        doc.rect(0, 480, 350, 20).fill('#1a1a2e');
        doc.fontSize(6).fill('#ffffff').text('Generated by Visitor Pass Management System', 0, 486, { width: 350, align: 'center' });

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
