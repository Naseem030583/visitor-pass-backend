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

// Generate PDF Badge - Left details, Right photo layout
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

        // ===== 1. RED HEADER BAR (full width) =====
        const headerH = 80;
        doc.rect(0, 0, pageW, headerH).fill('#e94560');
        doc.fontSize(22).fill('#ffffff').text('VISITOR PASS', 0, 18, { width: pageW, align: 'center' });
        doc.fontSize(8).fill('#ffffff').text('Visitor Pass Management System', 0, 46, { width: pageW, align: 'center' });

        // ===== 2. PHOTO ON RIGHT SIDE =====
        const photoSize = 140;
        const photoX = pageW - photoSize - 20;  // right side with margin
        const photoY = headerH - 25;            // overlaps header slightly

        if (visitor.photo && visitor.photo.startsWith('data:image')) {
            try {
                const base64Data = visitor.photo.replace(/^data:image\/\w+;base64,/, '');
                const photoBuffer = Buffer.from(base64Data, 'base64');
                // White background behind photo
                doc.roundedRect(photoX - 5, photoY - 5, photoSize + 10, photoSize + 10, 8).fill('#ffffff');
                // Photo with red border
                doc.image(photoBuffer, photoX, photoY, {
                    width: photoSize,
                    height: photoSize,
                    fit: [photoSize, photoSize]
                });
                doc.roundedRect(photoX, photoY, photoSize, photoSize, 5).lineWidth(2.5).stroke('#e94560');
            } catch (e) { /* skip */ }
        } else {
            // No photo placeholder
            doc.roundedRect(photoX - 5, photoY - 5, photoSize + 10, photoSize + 10, 8).fill('#ffffff');
            doc.roundedRect(photoX, photoY, photoSize, photoSize, 5).fill('#f0f0f0').stroke('#dddddd');
            doc.fontSize(40).fill('#cccccc').text('?', photoX + photoSize / 2 - 12, photoY + photoSize / 2 - 22);
        }

        // ===== 3. STATUS BADGE (below header, left of photo) =====
        const statusColor = visitor.status === 'approved' ? '#4ecca3' : visitor.status === 'checked-in' ? '#2196f3' : visitor.status === 'checked-out' ? '#888888' : '#ffc107';
        const badgeW = 100;
        const badgeX = 30;
        const badgeY = headerH + 8;
        doc.roundedRect(badgeX, badgeY, badgeW, 18, 9).fill(statusColor);
        doc.fontSize(8).fill('#ffffff').text(visitor.status.toUpperCase(), badgeX, badgeY + 4, { width: badgeW, align: 'center' });

        // ===== 4. LEFT SIDE DETAILS =====
        const leftM = 30;
        const leftW = photoX - leftM - 10; // text width stops before photo
        const labelSz = 7;
        const valSz = 11;
        let y = badgeY + 30;

        // VISITOR NAME
        doc.fontSize(16).fill('#333333').text(visitor.name, leftM, y, { width: leftW });
        y += 25;

        // COMPANY
        doc.fontSize(labelSz).fill('#878787').text('COMPANY:', leftM, y);
        y += 11;
        doc.fontSize(valSz).fill('#333333').text(visitor.company || 'N/A', leftM, y, { width: leftW });
        y += 22;

        // PURPOSE OF VISIT
        doc.fontSize(labelSz).fill('#878787').text('PURPOSE OF VISIT', leftM, y);
        y += 11;
        doc.fontSize(valSz).fill('#333333').text(visitor.purpose, leftM, y, { width: leftW });
        y += 22;

        // HOST
        doc.fontSize(labelSz).fill('#878787').text('HOST', leftM, y);
        y += 11;
        doc.fontSize(valSz).fill('#333333').text(visitor.host?.name || 'N/A', leftM, y, { width: leftW });
        y += 22;

        // PHONE
        doc.fontSize(labelSz).fill('#878787').text('PHONE', leftM, y);
        y += 11;
        doc.fontSize(valSz).fill('#333333').text(visitor.phone, leftM, y, { width: leftW });
        y += 22;

        // EXPECTED DATE
        doc.fontSize(labelSz).fill('#878787').text('EXPECTED DATE', leftM, y);
        y += 11;
        doc.fontSize(valSz).fill('#333333').text(new Date(visitor.expectedDate).toLocaleDateString(), leftM, y, { width: leftW });

        // ===== FIXED BOTTOM SECTION =====
        const footerH = 25;
        const footerY = pageH - footerH;
        const qrLabelY = footerY - 14;
        const qrSize = 90;
        const qrY = qrLabelY - qrSize - 4;
        const passCodeBoxH = 32;
        const passCodeY = qrY - passCodeBoxH - 10;

        // ===== 5. PASS CODE BOX =====
        const boxW = 300;
        doc.roundedRect((pageW - boxW) / 2, passCodeY, boxW, passCodeBoxH, 5).fill('#f0f0f0');
        doc.fontSize(7).fill('#878787').text('PASS CODE', (pageW - boxW) / 2, passCodeY + 4, { width: boxW, align: 'center' });
        doc.fontSize(14).fill('#e94560').text(visitor.passCode, (pageW - boxW) / 2, passCodeY + 16, { width: boxW, align: 'center' });

        // ===== 6. QR CODE =====
        if (visitor.qrCode) {
            const qrBase64 = visitor.qrCode.replace(/^data:image\/png;base64,/, '');
            const qrBuffer = Buffer.from(qrBase64, 'base64');
            doc.image(qrBuffer, (pageW - qrSize) / 2, qrY, { width: qrSize, height: qrSize });
        }

        // ===== 7. QR LABEL =====
        doc.fontSize(7).fill('#878787').text('Scan QR Code for verification', 0, qrLabelY, { width: pageW, align: 'center' });

        // ===== 8. DARK FOOTER =====
        doc.rect(0, footerY, pageW, footerH).fill('#1a1a2e');
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
