// async controller ke errors ko automatically errorHandler tak pahunchata hai
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);