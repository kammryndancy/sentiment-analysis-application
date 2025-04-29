// Middleware to ensure user is an admin
module.exports = function (req, res, next) {
  if (
    req.session &&
    req.session.roles &&
    Array.isArray(req.session.roles) &&
    req.session.roles.includes('admin')
  ) {
    return next();
  }
  res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
};
