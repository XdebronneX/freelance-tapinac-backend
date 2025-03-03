const UserModel = require('../models/user');
const jwt = require('jsonwebtoken');
const ErrorHandler = require('../utils/errorHandler');

exports.isAuthenticatedUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

        if (!token) {
            return next(new ErrorHandler('Authorization token missing. Please login to access this resource.', 401));
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = await UserModel.findById(decoded.id);

        if (!req.user) {
            return next(new ErrorHandler('User not found. Please login again.', 401));
        }

        next();
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            return next(new ErrorHandler('Session expired. Please login again.', 401));
        } else if (err instanceof jwt.JsonWebTokenError) {
            return next(new ErrorHandler('Invalid token. Please login again.', 401));
        }
        console.error('Token Verification Error:', err);
        return next(new ErrorHandler('An error occurred. Please try again later.', 500));
    }
};

exports.authorizeRoles = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return next(new ErrorHandler(`Role (${req.user.role}) is not allowed to access this resource`, 403));
    }
    next();
};
