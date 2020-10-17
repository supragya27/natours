const crypto = require('crypto')
const { promisify } = require('util')
const jwt = require('jsonwebtoken')
const AppError = require('../utils/appError')
const catchAsync = require('./../utils/catchAsync')
const User = require('./../models/userModel')
const sendEmail = require('./../utils/email')

const signToken = id => {
    return jwt.sign({ id }, process.env.SECRET, {
        expiresIn: process.env.EXPDATE
    })
}

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id)
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXP_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    }
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions)

    user.password = undefined

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
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

    createSendToken(newUser, 201, res)

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
    createSendToken(user, 200, res)

})

exports.logout=(req,res)=>{
    res.cookie('jwt','loggedout',{
        expires: new Date(Date.now()+10000),
        httpOnly:true
    })
    res.status(200).json({status:'success'})
}

exports.protect = catchAsync(async (req, res, next) => {
    //get token, check if it's there
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) 
    {
        token = req.headers.authorization.split(' ')[1]
    }
    else if(req.cookies.jwt){
        token=req.cookies.jwt
    }


    if (!token) {
        return next(new AppError('You are not logged in!', 401))
    }

    //token verification
    const decoded = await promisify(jwt.verify)(token, process.env.SECRET)


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

exports.forgotPassword = catchAsync(async (req, res, next) => {
    //get user
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        return next(new AppError('No such user exists', 404))
    }
    //generate token
    const resetToken = user.createPasswordResetToken()
    await user.save({ validateBeforeSave: false })

    //mail user
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}. \n Please ignore this email if you didn't forget your password!`

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token (valid only for 10minutes)',
            message
        })

        res.status(200).json({
            status: 'success',
            message: 'Token sent to mailer!'
        })
    }
    catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false })

        return next(new AppError('There was an error sending the email. Try again later!'), 500)
    }
})

exports.resetPassword = catchAsync(async (req, res, next) => {
    //get user
    const hashedToken = crypto.createHash('sha256')
        .update(req.params.token)
        .digest('hex')

    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } })

    //if token is valid and user is there, set new password
    if (!user) {
        return next(new AppError('Token is invalid r has expired', 400))
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save()
    //update changedPasswordAt property

    //log the user in (send JWT)
    createSendToken(user, 200, res)
})

exports.updatePassword = catchAsync(async (req, res, next) => {
    //get user
    const user = await User.findById(req.user.id).select('+password')

    //check current password
    if (!(await user.correctPassword(req.body.passwordOld, user.password)))
        return next(new AppError('Your current password is wrong', 401))

    //update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm
    await user.save()

    //log the user in(JWT)
    createSendToken(user, 200, res)
})

//only for rendered pages, has no errors
exports.isLoggedIn = async (req, res, next) => {
   
    if(req.cookies.jwt){
   try{
    const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.SECRET)


    //check user existance
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
        return next()
    }

    //if user changed password after jwt is issued
    if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next()

    }

    //if there is a logged in user
    res.locals.user=freshUser
    return next()
   }
   catch(error){
       return next()
   }
    
}
next()
}