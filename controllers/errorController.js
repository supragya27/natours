const AppError = require('./../utils/appError')

const handleCastError = err => {
    const message = `Invalid ${err.path}: ${err.value}`
    return new AppError(message, 400)
}

const handleDuplicateFields = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    console.log(value);

    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
};
const handleValidationError = err => {
    const errors = Object.values(err.errors).map(el => el.message);

    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJWTError = () =>
    new AppError('Invalid token. Please log in again!', 401);
const handleJWTExpError = () =>
    new AppError('Your token has expired! Please log in again.', 401);

    const sendErrorDev = (err,req, res) => {
        //API
    if(req.originalUrl.startsWith('/api'))
   {
    return res.status(err.statusCode).json({
        status: err.status,
        error: err,
        stack: err.stack,
        message: err.message,
    })
}
    else{
        //Rendered website
                console.error('ERROR ', err)
        return res.status(err.statusCode).render('error',{
            title:'Something went wrong!',
            msg: err.message
        })
    }
}

const sendErrorProd = (err,req, res) => {
    //API
    if(req.originalUrl.startsWith('/api'))
    {
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        })
    }
    else {
        console.error('ERROR ', err)

       return res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        })
    }
}
//RENDERED
        else{
            if (err.isOperational) {
                return res.status(err.statusCode).render('error',{
                    title:'Sonething went wrong!',
                    msg:'Please try again later'
                })
            }
            else {
                console.error('ERROR ', err)
        
                return res.status(err.statusCode).render('error',{
                    title:'Sonething went wrong!',
                    msg:'Please try again later'
                })
            }
        }
}

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err,req, res)
    }
    else if (process.env.NODE_ENV === 'production') {
        let error = { ...err }
        error.message=err.message

        if (error.name === 'CastError') { error = handleCastError(error) }
        if (error.code === 11000) error = handleDuplicateFields(error)
        if (error.name === 'ValidationError')
            error = handleValidationError(error);
        if (error.name === 'JsonWebTokenError')
            error = handleJWTError(error)
        if (error.name === 'TokenExpiredError')
            error = handleJWTExpError(error)

        sendErrorProd(error,req, res)
    }
}