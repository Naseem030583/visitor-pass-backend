const express = require('express');
const router = express.Router();
const {
    createVisitor,
    getAllVisitors,
    getVisitorById,
    updateVisitor,
    approveVisitor,
    checkInVisitor,
    checkOutVisitor,
    deleteVisitor,
    getDashboardStats
} = require('../controllers/visitorController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes require authentication
router.use(authenticate);

// Dashboard stats (admin & security)
router.get('/stats', authorize('admin', 'security'), getDashboardStats);

// Check-in and Check-out (security only)
router.post('/check-in', authorize('admin', 'security'), checkInVisitor);
router.post('/check-out', authorize('admin', 'security'), checkOutVisitor);

// Approve visitor (admin & employee)
router.patch('/:id/approve', authorize('admin', 'employee'), approveVisitor);

// CRUD operations
router.post('/', upload.single('photo'), createVisitor);
router.get('/', getAllVisitors);
router.get('/:id', getVisitorById);
router.put('/:id', upload.single('photo'), updateVisitor);
router.delete('/:id', authorize('admin'), deleteVisitor);

module.exports = router;