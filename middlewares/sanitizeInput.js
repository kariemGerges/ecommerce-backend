const sanitize = require('mongo-sanitize');

const sanitizeInput = (req, res, next) => {
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
};

module.exports = sanitizeInput;
