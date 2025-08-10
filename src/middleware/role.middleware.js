module.exports = function requireRole(role) {
  return (req, res, next) => {
    if (!req.body || req.body.role !== role) {
      return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
    }
    next();
  };
};