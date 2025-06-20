const authenticateToken = (req, res, next) => {
  // Check if user is authenticated via session
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  // Add user info to request object
  req.user = {
    id: req.session.userId,
    username: req.session.username,
    role: req.session.role
  };
  
  next();
};

module.exports = {
  authenticateToken
}; 