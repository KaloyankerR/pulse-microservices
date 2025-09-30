const { validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
    }));
    
    throw new AppError(
      `Validation failed: ${errorMessages.map(e => e.message).join(', ')}`,
      400,
      'VALIDATION_ERROR'
    );
  }
  
  next();
};

module.exports = { validate };

