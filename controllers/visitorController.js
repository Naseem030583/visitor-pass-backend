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

// Generate PDF Badge - Fixed single page layout
const generatePDF = async (req, res) => {
    try {
        const visitor = await visitorService.getVisitorById(req.params.id);

        const pageW = 400;
        const pageH = 560;

        const doc = new PDFDocument({
            size: [pageW, pageH],
            margins: { top: 0, bottom: 0, left: 0, right: 0 }
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=visitor-pass-${visitor.passCode}.pdf`);

        doc.pipe(res);

        // ===== FIXED POSITIONS (bottom-up) =====
        const footerY = pageH - 25;
        const qrLabelY = footerY - 14;
        const qrSize = 80;
        const qrY = qrLabelY - qrSize - 4;
        const passCodeBoxH = 30;
        const passCodeY = qrY - passCodeBoxH - 10;

        // ===== 1. RED HEADER BAR =====
        const headerH = 70;
        doc.rect(0, 0, pageW, headerH).fill('#e94560');
        doc.fontSize(20).fill('#ffffff').text('VISITOR PASS', 0, 18, { width: pageW, align: 'center' });
        doc.fontSize(8).fill('#ffffff').text('Visitor Pass Management System', 0, 44, { width: pageW, align: 'center' });

        // ===== 2. CIRCULAR PHOTO =====
        const photoRadius = 38;
        const photoCX = pageW / 2;
        const photoCY = headerH + 2;

        if (visitor.photo && visitor.photo.startsWith('data:image')) {
            try {
                const base64Data = visitor.photo.replace(/^data:image\/\w+;base64,/, '');
                const photoBuffer = Buffer.from(base64Data, 'base64');
                doc.circle(photoCX, photoCY, photoRadius + 3).fill('#ffffff');
                doc.save();
                doc.circle(photoCX, photoCY, photoRadius).clip();
                doc.image(photoBuffer, photoCX - photoRadius, photoCY - photoRadius, {
                    width: photoRadius * 2,
                    height: photoRadius * 2
                });
                doc.restore();
                doc.circle(photoCX, photoCY, photoRadius).lineWidth(2).stroke('#e94560');
            } catch (e) { /* skip */ }
        } else {
            doc.circle(photoCX, photoCY, photoRadius + 3).fill('#ffffff');
            doc.circle(photoCX, photoCY, photoRadius).fill('#f0f0f0');
            doc.fontSize(24).fill('#cccccc').text('?', photoCX - 7, photoCY - 12);
        }

        let y = photoCY + photoRadius + 8;

        // ===== 3. STATUS BADGE =====
        const statusColor = visitor.status === 'approved' ? '#4ecca3' : visitor.status === 'checked-in' ? '#2196f3' : visitor.status === 'checked-out' ? '#888888' : '#ffc107';
        const badgeW = 100;
        doc.roundedRect((pageW - badgeW) / 2, y, badgeW, 16, 8).fill(statusColor);
        doc.fontSize(7).fill('#ffffff').text(visitor.status.toUpperCase(), (pageW - badgeW) / 2, y + 4, { width: badgeW, align: 'center' });
        y += 22;

        // ===== 4. VISITOR NAME =====
        doc.fontSize(16).fill('#333333').text(visitor.name, 0, y, { width: pageW, align: 'center' });
        y += 24;

        // ===== 5. DETAILS (fills space between name and pass code) =====
        const detailEndY = passCodeY - 5;
        const availableH = detailEndY - y;
        const numFields = 5;
        const fieldH = Math.min(availableH / numFields, 30);
        const leftM = 40;
        const labelSz = 7;
        const valSz = 10;

        // COMPANY
        doc.fontSize(labelSz).fill('#878787').text('COMPANY:', leftM, y);
        doc.fontSize(valSz).fill('#333333').text(visitor.company || 'N/A', leftM, y + 10);
        y += fieldH;

        // PURPOSE OF VISIT
        doc.fontSize(labelSz).fill('#878787').text('PURPOSE OF VISIT', leftM, y);
        doc.fontSize(valSz).fill('#333333').text(visitor.purpose, leftM, y + 10);
        y += fieldH;

        // HOST
        doc.fontSize(labelSz).fill('#878787').text('HOST', leftM, y);
        doc.fontSize(valSz).fill('#333333').text(visitor.host?.name || 'N/A', leftM, y + 10);
        y += fieldH;

        // PHONE
        doc.fontSize(labelSz).fill('#878787').text('PHONE', leftM, y);
        doc.fontSize(valSz).fill('#333333').text(visitor.phone, leftM, y + 10);
        y += fieldH;

        // EXPECTED DATE
        doc.fontSize(labelSz).fill('#878787').text('EXPECTED DATE', leftM, y);
        doc.fontSize(valSz).fill('#333333').text(new Date(visitor.expectedDate).toLocaleDateString(), leftM, y + 10);

        // ===== 6. PASS CODE BOX (fixed position) =====
        const boxW = 250;
        doc.roundedRect((pageW - boxW) / 2, passCodeY, boxW, passCodeBoxH, 5).fill('#f0f0f0');
        doc.fontSize(6).fill('#878787').text('PASS CODE', (pageW - boxW) / 2, passCodeY + 3, { width: boxW, align: 'center' });
        doc.fontSize(13).fill('#e94560').text(visitor.passCode, (pageW - boxW) / 2, passCodeY + 14, { width: boxW, align: 'center' });

        // ===== 7. QR CODE (fixed position) =====
        if (visitor.qrCode) {
            const qrBase64 = visitor.qrCode.replace(/^data:image\/png;base64,/, '');
            const qrBuffer = Buffer.from(qrBase64, 'base64');
            doc.image(qrBuffer, (pageW - qrSize) / 2, qrY, { width: qrSize, height: qrSize });
        }

        // ===== 8. QR LABEL (fixed position) =====
        doc.fontSize(7).fill('#878787').text('Scan QR Code for verification', 0, qrLabelY, { width: pageW, align: 'center' });

        // ===== 9. DARK FOOTER (fixed position) =====
        doc.rect(0, footerY, pageW, 25).fill('#1a1a2e');
        doc.fontSize(7).fill('#ffffff').text('Generated by Visitor Pass Management System', 0, footerY + 8, { width: pageW, align: 'center' });

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
