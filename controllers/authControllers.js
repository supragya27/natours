const jwt = require('jsonwebtoken')
const AppError = require('../utils/appError')
const User = require('./../models/userModel')
const catchAsync = require('./../utils/catchAsync')


exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
    })

    const token = jwt.sign({ id: newUser._id }, process.env.SECRET, {
        expiresIn: process.env.EXPDATE
    })

    res.status(201).json({
        status: 'success',
        token,
        data: {
            user: newUser
        }
    })
})

exports.login = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password)
        next(new AppError('Please provide both email and password', 400))




    const token = '';
    res.status(200).json({
        status: 'success',
        token
    })

}