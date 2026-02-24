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

// Generate PDF Badge - Matching reference design
const generatePDF = async (req, res) => {
    try {
        const visitor = await visitorService.getVisitorById(req.params.id);

        const pageW = 400;
        const pageH = 550;

        const doc = new PDFDocument({
            size: [pageW, pageH],
            margins: { top: 0, bottom: 0, left: 0, right: 0 }
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=visitor-pass-${visitor.passCode}.pdf`);

        doc.pipe(res);

        // ===== RED HEADER BAR =====
        const headerH = 80;
        doc.rect(0, 0, pageW, headerH).fill('#e94560');
        doc.fontSize(22).fill('#ffffff').text('VISITOR PASS', 0, 20, { width: pageW, align: 'center' });
        doc.fontSize(9).fill('#ffffff').text('Visitor Pass Management System', 0, 48, { width: pageW, align: 'center' });

        // ===== CIRCULAR PHOTO (overlapping header) =====
        const photoRadius = 45;
        const photoCenterX = pageW / 2;
        const photoCenterY = headerH + 5; // slightly below header edge

        if (visitor.photo && visitor.photo.startsWith('data:image')) {
            try {
                const base64Data = visitor.photo.replace(/^data:image\/\w+;base64,/, '');
                const photoBuffer = Buffer.from(base64Data, 'base64');
                // White circle background
                doc.circle(photoCenterX, photoCenterY, photoRadius + 3).fill('#ffffff');
                // Clip to circle and draw photo
                doc.save();
                doc.circle(photoCenterX, photoCenterY, photoRadius).clip();
                doc.image(photoBuffer, photoCenterX - photoRadius, photoCenterY - photoRadius, {
                    width: photoRadius * 2,
                    height: photoRadius * 2
                });
                doc.restore();
                // Red circle border
                doc.circle(photoCenterX, photoCenterY, photoRadius).lineWidth(2.5).stroke('#e94560');
            } catch (e) {
                // Skip photo on error
            }
        } else {
            // No photo - gray placeholder circle
            doc.circle(photoCenterX, photoCenterY, photoRadius + 3).fill('#ffffff');
            doc.circle(photoCenterX, photoCenterY, photoRadius).fill('#f0f0f0');
            doc.fontSize(30).fill('#cccccc').text('👤', photoCenterX - 15, photoCenterY - 18);
        }

        let y = photoCenterY + photoRadius + 12;

        // ===== STATUS BADGE =====
        const statusColor = visitor.status === 'approved' ? '#4ecca3' : visitor.status === 'checked-in' ? '#2196f3' : visitor.status === 'checked-out' ? '#888888' : '#ffc107';
        const badgeW = 120;
        doc.roundedRect((pageW - badgeW) / 2, y, badgeW, 20, 10).fill(statusColor);
        doc.fontSize(9).fill('#ffffff').text(visitor.status.toUpperCase(), (pageW - badgeW) / 2, y + 5, { width: badgeW, align: 'center' });
        y += 30;

        // ===== VISITOR NAME =====
        doc.fontSize(18).fill('#333333').text(visitor.name, 0, y, { width: pageW, align: 'center' });
        y += 28;

        // ===== DETAILS (single column, centered) =====
        const labelSize = 8;
        const valueSize = 12;
        const detailGap = 32;
        const leftMargin = 40;

        // COMPANY
        doc.fontSize(labelSize).fill('#878787').text('COMPANY:', leftMargin, y);
        y += 13;
        doc.fontSize(valueSize).fill('#333333').text(visitor.company || 'N/A', leftMargin, y);
        y += detailGap - 10;

        // PURPOSE OF VISIT
        doc.fontSize(labelSize).fill('#878787').text('PURPOSE OF VISIT', leftMargin, y);
        y += 13;
        doc.fontSize(valueSize).fill('#333333').text(visitor.purpose, leftMargin, y);
        y += detailGap - 10;

        // HOST
        doc.fontSize(labelSize).fill('#878787').text('HOST', leftMargin, y);
        y += 13;
        doc.fontSize(valueSize).fill('#333333').text(visitor.host?.name || 'N/A', leftMargin, y);
        y += detailGap - 10;

        // PHONE
        doc.fontSize(labelSize).fill('#878787').text('PHONE', leftMargin, y);
        y += 13;
        doc.fontSize(valueSize).fill('#333333').text(visitor.phone, leftMargin, y);
        y += detailGap - 10;

        // EXPECTED DATE
        doc.fontSize(labelSize).fill('#878787').text('EXPECTED DATE', leftMargin, y);
        y += 13;
        doc.fontSize(valueSize).fill('#333333').text(new Date(visitor.expectedDate).toLocaleDateString(), leftMargin, y);
        y += detailGap - 5;

        // ===== PASS CODE BOX =====
        const boxW = 280;
        const boxH = 35;
        doc.roundedRect((pageW - boxW) / 2, y, boxW, boxH, 6).fill('#f0f0f0');
        doc.fontSize(7).fill('#878787').text('PASS CODE', (pageW - boxW) / 2, y + 4, { width: boxW, align: 'center' });
        doc.fontSize(15).fill('#e94560').text(visitor.passCode, (pageW - boxW) / 2, y + 16, { width: boxW, align: 'center' });
        y += boxH + 12;

        // ===== QR CODE =====
        if (visitor.qrCode) {
            const qrBase64 = visitor.qrCode.replace(/^data:image\/png;base64,/, '');
            const qrBuffer = Buffer.from(qrBase64, 'base64');
            const qrSize = 90;
            doc.image(qrBuffer, (pageW - qrSize) / 2, y, { width: qrSize, height: qrSize });
            y += qrSize + 6;
            doc.fontSize(7).fill('#878787').text('Scan QR Code for verification', 0, y, { width: pageW, align: 'center' });
        }

        // ===== DARK FOOTER BAR =====
        doc.rect(0, pageH - 25, pageW, 25).fill('#1a1a2e');
        doc.fontSize(7).fill('#ffffff').text('Generated by Visitor Pass Management System', 0, pageH - 17, { width: pageW, align: 'center' });

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
