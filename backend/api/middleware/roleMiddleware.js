module.exports = function(roles = []) {
  // roles param can be a single role string (e.g. 'admin') or array of roles
  if (typeof roles === 'string') roles = [roles];
  return (req, res, next) => {
    if (!req.session.user || (roles.length && !roles.includes(req.session.user.role))) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions' });
    }
    next();
  };
};
