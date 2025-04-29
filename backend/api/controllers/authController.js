// Import required modules
const User = require('../models/User');
const bcrypt = require('bcrypt');

// Simple in-memory user for demonstration
// const DEMO_USER = { username: 'demo', password: 'demo' };

// Registration endpoint
exports.register = async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required' });
  }
  try {
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, roles: ['user'], pendingRoles: [], approved: false });
    await user.save();
    res.json({ success: true, username: user.username, roles: user.roles });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Registration failed', error: err.message });
  }
};

// Updated login
exports.login = async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  if (!user.enabled) {
    return res.status(403).json({ success: false, message: 'Account pending admin approval.' });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  req.session.userId = user._id;
  req.session.username = user.username;
  req.session.roles = user.roles;
  res.json({ success: true, username: user.username, roles: user.roles });
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
};

exports.check = (req, res) => {
  if (req.session.username && req.session.roles) {
    res.json({ authenticated: true, username: req.session.username, roles: req.session.roles });
  } else {
    res.json({ authenticated: false });
  }
};
