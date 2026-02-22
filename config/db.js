const mongoose = require('mongoose');
const dns = require('dns');

// Force Google DNS to fix SRV resolution
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected Successfully !!');
    } catch (error) {
        console.log('MongoDB Connection Failed:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
