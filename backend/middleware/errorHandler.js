const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('Error:', err);

  res.status(error.statusCode || 500).json({
    status: 'error',
    message: error.message || 'Server Error'
  });
};

module.exports = errorHandler;
