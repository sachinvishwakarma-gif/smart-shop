const { HttpError } = require("./errorHandler");

const OBJECT_ID = /^[a-f\d]{24}$/i;

module.exports = (param = "id") => (req, res, next) => {
  if (!OBJECT_ID.test(req.params[param])) return next(new HttpError(400, "Invalid id"));
  next();
};