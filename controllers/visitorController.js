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

// Generate PDF Badge
const generatePDF = async (req, res) => {
    try {
        const visitor = await visitorService.getVisitorById(req.params.id);
        if (!visitor) {
            return res.status(404).json({ message: 'Visitor not found' });
        }

        const pageW = 400;
        const pageH = 550;

        const doc = new PDFDocument({
            size: [pageW, pageH],
            margins: { top: 0, bottom: 0, left: 0, right: 0 }
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=visitor-pass-${visitor.passCode}.pdf`);

        doc.pipe(res);

        
        // 1. RED HEADER BAR
        
        doc.rect(0, 0, pageW, 80).fill('#E94560');
        doc.fontSize(22).fill('#ffffff').text('VISITOR PASS', 0, 18, { width: pageW, align: 'center' });
        doc.fontSize(8).fill('#ffffff').text('Visitor Pass Management System', 0, 46, { width: pageW, align: 'center' });

        
        // 2. STATUS BADGE (centered below header)
        
        const statusColor = visitor.status === 'approved' ? '#4ECCA3'
            : visitor.status === 'checked-in' ? '#2196F3'
            : visitor.status === 'checked-out' ? '#888888'
            : '#FFC107';
        const badgeW = 120;
        const badgeH = 25;
        const badgeX = (pageW - badgeW) / 2;
        const badgeY = 88;
        doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 12).fill(statusColor);
        doc.fontSize(10).fill('#ffffff').text(
            visitor.status.toUpperCase(),
            badgeX, badgeY + 7,
            { width: badgeW, align: 'center' }
        );

        
        // 3. TWO COLUMNS: LEFT = details, RIGHT = photo
        
        const contentY = badgeY + badgeH + 15;

        // ADDed RIGHT SIDE: PHOTO 
        const photoW = 145;
        const photoH = 175;
        const photoX = pageW - photoW - 18;
        const photoY = contentY;

        let hasPhoto = false;
        if (visitor.photo && visitor.photo.startsWith('data:image')) {
            try {
                const base64Data = visitor.photo.replace(/^data:image\/\w+;base64,/, '');
                const photoBuffer = Buffer.from(base64Data, 'base64');
                // White border background
                doc.roundedRect(photoX - 4, photoY - 4, photoW + 8, photoH + 8, 6).fill('#ffffff');
                doc.roundedRect(photoX - 4, photoY - 4, photoW + 8, photoH + 8, 6).lineWidth(1).stroke('#eeeeee');
                // Photo image
                doc.image(photoBuffer, photoX, photoY, { width: photoW, height: photoH, fit: [photoW, photoH] });
                // Red border
                doc.roundedRect(photoX, photoY, photoW, photoH, 4).lineWidth(2.5).stroke('#E94560');
                hasPhoto = true;
            } catch (e) {
                // Photo failed, skip
            }
        }

        if (!hasPhoto) {
            doc.roundedRect(photoX - 4, photoY - 4, photoW + 8, photoH + 8, 6).fill('#ffffff');
            doc.roundedRect(photoX, photoY, photoW, photoH, 4).fill('#f5f5f5');
            doc.roundedRect(photoX, photoY, photoW, photoH, 4).lineWidth(1).stroke('#dddddd');
            doc.fontSize(14).fill('#cccccc').text('No Photo', photoX, photoY + photoH / 2 - 8, { width: photoW, align: 'center' });
        }

        // ADDed LEFT SIDE: DETAILS
        const leftX = 25;
        const maxTextW = photoX - leftX - 12;

        let y = contentY;

        // Name
        doc.fontSize(16).fill('#333333').text(visitor.name, leftX, y, { width: maxTextW });
        y += 26;

        // Company
        doc.fontSize(7).fill('#878787').text('COMPANY:', leftX, y);
        y += 12;
        doc.fontSize(11).fill('#333333').text(visitor.company || 'N/A', leftX, y, { width: maxTextW });
        y += 20;

        // Purpose
        doc.fontSize(7).fill('#878787').text('PURPOSE OF VISIT', leftX, y);
        y += 12;
        doc.fontSize(11).fill('#333333').text(visitor.purpose, leftX, y, { width: maxTextW });
        y += 20;

        // Host
        doc.fontSize(7).fill('#878787').text('HOST', leftX, y);
        y += 12;
        doc.fontSize(11).fill('#333333').text(visitor.host?.name || 'N/A', leftX, y, { width: maxTextW });
        y += 20;

        // Phone
        doc.fontSize(7).fill('#878787').text('PHONE', leftX, y);
        y += 12;
        doc.fontSize(11).fill('#333333').text(visitor.phone || 'N/A', leftX, y, { width: maxTextW });
        y += 20;

        // Expected Date
        doc.fontSize(7).fill('#878787').text('EXPECTED DATE', leftX, y);
        y += 12;
        doc.fontSize(11).fill('#333333').text(
            visitor.expectedDate ? new Date(visitor.expectedDate).toLocaleDateString() : 'N/A',
            leftX, y, { width: maxTextW }
        );

        
        // 4. PASS CODE BOX (fixed near bottom)
        
        const footerH = 25;
        const footerY = pageH - footerH;
        const qrLabelY = footerY - 14;
        const qrSize = 88;
        const qrY = qrLabelY - qrSize - 5;
        const pcBoxH = 32;
        const pcBoxY = qrY - pcBoxH - 12;
        const pcBoxW = 300;

        doc.roundedRect((pageW - pcBoxW) / 2, pcBoxY, pcBoxW, pcBoxH, 5).fill('#F0F0F0');
        doc.fontSize(7).fill('#878787').text('PASS CODE', (pageW - pcBoxW) / 2, pcBoxY + 4, { width: pcBoxW, align: 'center' });
        doc.fontSize(14).fill('#E94560').text(
            visitor.passCode || 'N/A',
            (pageW - pcBoxW) / 2, pcBoxY + 16,
            { width: pcBoxW, align: 'center' }
        );

        
        // 5. QR CODE
        
        if (visitor.qrCode) {
            try {
                const qrBase64 = visitor.qrCode.replace(/^data:image\/png;base64,/, '');
                const qrBuffer = Buffer.from(qrBase64, 'base64');
                doc.image(qrBuffer, (pageW - qrSize) / 2, qrY, { width: qrSize, height: qrSize });
            } catch (e) {
                // QR failed, skip
            }
        }

        
        // 6. QR LABEL
        
        doc.fontSize(7).fill('#878787').text('Scan QR Code for verification', 0, qrLabelY, { width: pageW, align: 'center' });

        
        // 7. DARK FOOTER
        
        doc.rect(0, footerY, pageW, footerH).fill('#1A1A2E');
        doc.fontSize(7).fill('#ffffff').text('Generated by Visitor Pass Management System', 0, footerY + 8, { width: pageW, align: 'center' });

        doc.end();
    } catch (error) {
        console.error('PDF Generation Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error generating PDF: ' + error.message });
        }
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
