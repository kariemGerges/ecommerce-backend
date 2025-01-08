const restrictQuery = (allowedFields) => {
    return (req, res, next) => {
      const queryKeys = Object.keys(req.query);
      for (const key of queryKeys) {
        if (!allowedFields.includes(key)) {
          return res.status(400).json({ message: `Query field "${key}" is not allowed` });
        }
      }
      next();
    };
  };
  
module.exports = restrictQuery;