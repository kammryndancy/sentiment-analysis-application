const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/authMiddleware');
const User = require('../models/User');
const bcrypt = require('bcrypt');

// POST /api/users/request-role
router.post('/request-role', requireAuth, async (req, res) => {
  const { role } = req.body;
  const userId = req.session.userId;
  if (!role || !['admin', 'user'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.roles.includes(role) || user.pendingRoles.includes(role)) {
      return res.status(409).json({ success: false, message: 'Role already assigned or pending' });
    }
    user.pendingRoles.push(role);
    await user.save();
    res.json({ success: true, pendingRoles: user.pendingRoles });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// POST /api/users/update-password
router.post('/update-password', requireAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.session.userId;
  if (!oldPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Old and new password required. New password must be at least 6 characters.' });
  }
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Old password is incorrect.' });
    }
    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ADMIN ONLY: Middleware
function requireAdmin(req, res, next) {
  if (req.session && req.session.roles && req.session.roles.includes('admin')) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Admin access required' });
}

// GET /api/users/pending-roles (admin only)
router.get('/pending-roles', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({ pendingRoles: { $exists: true, $not: { $size: 0 } } }, 'username roles pendingRoles');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// POST /api/users/approve-role (admin only)
router.post('/approve-role', requireAuth, requireAdmin, async (req, res) => {
  const { username, role } = req.body;
  if (!username || !role) {
    return res.status(400).json({ success: false, message: 'Missing username or role' });
  }
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!user.pendingRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Role not pending' });
    }
    user.pendingRoles = user.pendingRoles.filter(r => r !== role);
    if (!user.roles.includes(role)) user.roles.push(role);
    await user.save();
    res.json({ success: true, roles: user.roles, pendingRoles: user.pendingRoles });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// POST /api/users/reject-role (admin only)
router.post('/reject-role', requireAuth, requireAdmin, async (req, res) => {
  const { username, role } = req.body;
  if (!username || !role) {
    return res.status(400).json({ success: false, message: 'Missing username or role' });
  }
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!user.pendingRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Role not pending' });
    }
    user.pendingRoles = user.pendingRoles.filter(r => r !== role);
    await user.save();
    res.json({ success: true, pendingRoles: user.pendingRoles });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;
