module.exports = function (req, res, next) {
  // Accept session with userId (and optionally username, roles)
  if (req.session && req.session.userId) {
    return next();
  }
  res.status(401).json({ success: false, message: 'Unauthorized' });
};
