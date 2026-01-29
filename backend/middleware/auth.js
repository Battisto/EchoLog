// Simple auth middleware for future use
const auth = (req, res, next) => {
  // For now, just pass through
  next();
};

module.exports = auth;
