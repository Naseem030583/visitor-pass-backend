const authService = require('../services/authService');

// Register
const register = async (req, res) => {
    try {
        const result = await authService.registerUser(req.body);
        res.status(201).json({
            message: 'User registered successfully !!',
            ...result
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const result = await authService.loginUser(email, password);
        res.status(200).json({
            message: 'Login successful !!',
            ...result
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get current user profile
const getProfile = async (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
    try {
        const users = await authService.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { register, login, getProfile, getAllUsers };