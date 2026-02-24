// Seed Script - Populates database with demo data
// Run: node seed.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Visitor = require('./models/Visitor');
const QRCode = require('qrcode');
const crypto = require('crypto');

const seedData = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected !!');

        // Clear existing data
        await User.deleteMany({});
        await Visitor.deleteMany({});
        console.log('Cleared existing data !!');

        // Create Users
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const securityPassword = await bcrypt.hash('security123', 10);
        const employeePassword = await bcrypt.hash('naseem123', 10);

        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@visitor.com',
            password: hashedPassword,
            role: 'admin',
            department: 'Management',
            phone: '9876543210'
        });

        const security = await User.create({
            name: 'Security Guard',
            email: 'security@visitor.com',
            password: securityPassword,
            role: 'security',
            department: 'Security',
            phone: '9876543211'
        });

        const employee = await User.create({
            name: 'Naseem Ahamad',
            email: 'naseem@visitor.com',
            password: employeePassword,
            role: 'employee',
            department: 'IT',
            phone: '9876543212'
        });

        console.log('Users created !!');

        // Create Visitors
        const visitors = [
            {
                name: 'Rahul Sharma',
                email: 'rahul@gmail.com',
                phone: '8765432100',
                company: 'TechCorp',
                purpose: 'Business Meeting',
                host: employee._id,
                status: 'approved',
                expectedDate: new Date('2026-02-25'),
                createdBy: admin._id
            },
            {
                name: 'Amit Kumar',
                email: 'amit@gmail.com',
                phone: '9999888877',
                company: 'InfoTech',
                purpose: 'Interview',
                host: employee._id,
                status: 'pending',
                expectedDate: new Date('2026-02-26'),
                createdBy: admin._id
            },
            {
                name: 'Priya Singh',
                email: 'priya@gmail.com',
                phone: '7777666655',
                company: 'DataSoft',
                purpose: 'Project Discussion',
                host: employee._id,
                status: 'checked-in',
                checkInTime: new Date(),
                expectedDate: new Date('2026-02-24'),
                createdBy: employee._id
            },
            {
                name: 'Vikram Patel',
                email: 'vikram@gmail.com',
                phone: '6666555544',
                company: 'CloudNet',
                purpose: 'Client Demo',
                host: employee._id,
                status: 'checked-out',
                checkInTime: new Date(Date.now() - 3600000),
                checkOutTime: new Date(),
                expectedDate: new Date('2026-02-24'),
                createdBy: admin._id
            },
            {
                name: 'Neha Gupta',
                email: 'neha@gmail.com',
                phone: '5555444433',
                company: 'WebWorks',
                purpose: 'Training Session',
                host: employee._id,
                status: 'pending',
                expectedDate: new Date('2026-02-27'),
                createdBy: employee._id
            }
        ];

        for (const visitorData of visitors) {
            const passCode = crypto.randomBytes(6).toString('hex');
            visitorData.passCode = passCode;

            const visitor = await Visitor.create(visitorData);

            const qrData = JSON.stringify({
                id: visitor._id,
                passCode: passCode,
                name: visitor.name
            });
            const qrCode = await QRCode.toDataURL(qrData);
            visitor.qrCode = qrCode;
            await visitor.save();
        }

        console.log('Visitors created with QR codes !!');

        // Summary
        console.log('\n===== SEED DATA SUMMARY =====');
        console.log(`Users created: 3 (Admin, Security, Employee)`);
        console.log(`Visitors created: 5`);
        console.log(`  - Pending: 2`);
        console.log(`  - Approved: 1`);
        console.log(`  - Checked-In: 1`);
        console.log(`  - Checked-Out: 1`);
        console.log('\nDemo Credentials:');
        console.log('  Admin: admin@visitor.com / admin123');
        console.log('  Security: security@visitor.com / security123');
        console.log('  Employee: naseem@visitor.com / naseem123');
        console.log('=============================\n');

        process.exit(0);
    } catch (error) {
        console.error('Seed Error:', error.message);
        process.exit(1);
    }
};

seedData();
