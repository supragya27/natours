const path = require('path')
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')

const errorController = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const reviewRouter = require('./routes/reviewRoutes')

const app = express();

app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))


// global middlewares

//serving static files
app.use(express.static(path.join(__dirname, 'public')));

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

//data sanitization against NoSQL query injection
app.use(mongoSanitize())

//data sanitization against xss
app.use(xss())

//prevent parameter pollution
app.use(hpp({
  whitelist: ['duration', 'maxGroupSize', 'ratingsAverage', 'ratingsQuantity', 'difficulty', 'price']
}
))
//routes
app.get('/', (req, res) => {
  res.status(200).render('base', {
    tour: 'Dhalon',
    user: 'Supi'
  })
})

app.get('/overview',(req,res)=>{
  res.status(200).render('overview',{
    title:'All Tours'
  })
})

app.get('/tour',(req,res)=>{
  res.status(200).render('tour',{
    title:'The Forest Hiker'
  })
})

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
})

app.use(errorController)

module.exports = app;
