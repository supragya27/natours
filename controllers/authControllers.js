const { promisify } = require('util')
const jwt = require('jsonwebtoken')
const AppError = require('../utils/appError')
const catchAsync = require('./../utils/catchAsync')
const User = require('./../models/userModel')

const signToken = id => {
    return jwt.sign({ id }, process.env.SECRET, {
        expiresIn: process.env.EXPDATE
    })
}

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role
    })

    const token = signToken(newUser._id)

    res.status(201).json({
        status: 'success',
        token,
        data: {
            user: newUser
        }
    })
})

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    //check email and password
    if (!email || !password)
        return next(new AppError('Please provide both email and password', 400))

    //check if email and password are correct
    const user = await User.findOne({ email }).select('+password')
    //console.log(user)
    if (!user || !(await user.correctPassword(password, user.password)))
        return next(new AppError('Incorrect email and/or password', 401))

    //send back token
    const token = signToken(user._id);
    res.status(200).json({
        status: 'success',
        token
    })

})

exports.protect = catchAsync(async (req, res, next) => {
    //get token, check if it's there
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
        return next(new AppError('You are not logged in!', 401))
    }

    //token verification
    const decoded = await promisify(jwt.verify)(token, process.env.SECRET)
    console.log(decoded)

    //check user existance
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
        return next(new AppError(
            'The user no longer exists', 401
        ))
    }

    //if user changed password after jwt is issued
    if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('Password changed recently! Please login again.', 401))

    }

    req.user = freshUser
    next()
})

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have the permission to perform this action', 403))
        }
        next()
    }
}