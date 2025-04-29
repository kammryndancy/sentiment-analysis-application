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

// POST /api/users/approve (admin only) - Enable a user (set enabled: true, update updatedAt)
router.post('/approve', requireAuth, requireAdmin, async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ success: false, message: 'Missing username' });
  }
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.enabled = true;
    user.updatedAt = new Date();
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// POST /api/users/disable (admin only) - Disable a user (set enabled: false, update updatedAt)
router.post('/disable', requireAuth, requireAdmin, async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ success: false, message: 'Missing username' });
  }
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    // Prevent disabling if this is the last enabled admin
    if (user.roles.includes('admin') && user.enabled) {
      const enabledAdmins = await User.countDocuments({ roles: 'admin', enabled: true });
      if (enabledAdmins <= 1) {
        return res.status(400).json({ success: false, message: 'There must be at least one enabled admin at all times.' });
      }
    }
    user.enabled = false;
    user.updatedAt = new Date();
    await user.save();
    // Destroy all sessions for this user if using session store
    const sessionStore = req.sessionStore;
    if (sessionStore && typeof sessionStore.all === 'function' && typeof sessionStore.destroy === 'function') {
      sessionStore.all((err, sessions) => {
        if (!err && sessions) {
          Object.keys(sessions).forEach(sid => {
            const sess = sessions[sid];
            if (sess.username === username) {
              sessionStore.destroy(sid, () => {});
            }
          });
        }
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// POST /api/users/remove-role
router.post('/remove-role', requireAuth, async (req, res) => {
  const { username, role } = req.body;
  if (!username || !role) {
    return res.status(400).json({ success: false, message: 'Username and role are required' });
  }
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!user.roles.includes(role)) {
      return res.status(409).json({ success: false, message: 'Role not assigned to user' });
    }
    // Prevent self-removal of admin role
    if (role === 'admin' && req.session.username === username) {
      return res.status(403).json({ success: false, message: 'You cannot remove your own admin role' });
    }
    user.roles = user.roles.filter(r => r !== role);
    await user.save();

    // Reset session for the affected user if they are logged in
    if (req.sessionStore && typeof req.sessionStore.all === 'function') {
      req.sessionStore.all((err, sessions) => {
        if (!err && sessions) {
          Object.entries(sessions).forEach(([sid, sess]) => {
            try {
              const parsed = typeof sess === 'string' ? JSON.parse(sess) : sess;
              if (parsed.username === username) {
                // Update the session roles
                parsed.roles = user.roles;
                req.sessionStore.set(sid, parsed, () => {});
              }
            } catch {}
          });
        }
      });
    }

    res.json({ success: true, roles: user.roles });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET /api/users/list - List users for admins and users (fields depend on role)
router.get('/list', requireAuth, async (req, res) => {
  try {
    const isAdmin = req.session && req.session.roles && req.session.roles.includes('admin');
    // Only select the fields needed for the frontend
    let projection = 'username roles createdAt enabled updatedAt';
    if (isAdmin) {
      projection += ' pendingRoles';
    }
    const users = await User.find({}, projection).lean();
    // For non-admins, remove pendingRoles field if present
    if (!isAdmin) {
      users.forEach(u => { delete u.pendingRoles; });
    }
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;
