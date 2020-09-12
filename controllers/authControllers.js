const jwt = require('jsonwebtoken')
const AppError = require('../utils/appError')
const User = require('./../models/userModel')
const catchAsync = require('./../utils/catchAsync')

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
        passwordConfirm: req.body.passwordConfirm
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
    console.log(user)
    if (!user || !(await user.correctPassword(password, user.password)))
        return next(new AppError('Incorrect email andor password', 401))

    //send back token
    const token = signToken(user._id);
    res.status(200).json({
        status: 'success',
        token
    })

})