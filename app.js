const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')

const errorController = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');

const app = express();

// global middlewares

//set security http headers
app.use(helmet())

//dev logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//limit requests to api
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests! Try again after an hour!'
})
app.use('/api', limiter)

//body parser:reading data from body to req.body
app.use(express.json({ limit: '10kb' }));

//serving static files
app.use(express.static(`${__dirname}/public`));


app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
})

app.use(errorController)

module.exports = app;
