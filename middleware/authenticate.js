const { User, Admin } = require("../models");
const ErrorHandler = require("../utils/ErrorHandling");
const catchAsyncError = require("./catchAsyncError");
const jwt = require("jsonwebtoken");

// Token is valid or not middleware
exports.isAuthenticated = catchAsyncError(async (req, res, next) => {
    const headers = req.headers.authorization;
    if (!headers) {
        throw new ErrorHandler("Please login to access this resource", 401);
    }
    const token = headers.split(" ")[1];
    if (!token) {
        throw new ErrorHandler("Please Enter valid Token", 401);
    }

    const data = jwt.verify(token, process.env.JWT_SEC);

    const user = await User.findById(data._id);
    if (!user) {
        throw new ErrorHandler("Token is expired or Invalid.", 401);
    }

    if (user.status === 0) throw new ErrorHandler("Account is deactivated. Contact support for assistance.", 401);

    if (user.isVerified === 0) throw new ErrorHandler("Please verified your email.", 401);

    req.user = data._id;
    next();
});

// Token is valid or not middleware
exports.isAuthenticatedAdmin = catchAsyncError(async (req, res, next) => {
    const headers = req.headers.authorization;
    if (!headers) {
        throw new ErrorHandler("Please login to access this resource", 401);
    }
    const token = headers.split(" ")[1];
    if (!token) {
        throw new ErrorHandler("Please Enter valid Token", 401);
    }

    const data = jwt.verify(token, process.env.JWT_SEC);

    const user = await Admin.findById(data._id);
    if (!user) {
        throw new ErrorHandler("Token is expired or Invalid.", 401);
    }

    req.user = data._id;
    next();
});

// authenticate middleware
exports.isAuthenticatedUser = (...role) => {
    return catchAsyncError(async (req, res, next) => {
        const id = req.user;
        const user = await User.findOne({ _id: id });
        if (role.includes(user.role)) {
            next()
        } else {
            throw new ErrorHandler(`You are not register as a ${role}`, 401);
        }
    });
}

