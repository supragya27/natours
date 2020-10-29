const User = require('../models/userModel');
const multer = require('multer')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('../utils/appError')
const factory = require('./handlerFactory')

const multerStorage=multer.diskStorage({
  destination: (req,file,cb)=>{
    cb(null,'public/img/users')
  },
  filename:(req,file,cb)=>{
    const ext=file.mimetype.split('/')[1]
    cb(null,`user-${req.user.id}-${Date.now()}.${ext}`)
  }
})

const multerFilter=(req,file,cb)=>{
  if(file.mimetype.startsWith('image'))
    cb(null,true)
  else
    cb(new AppError('Please upload only images!',400) ,false)
}

const upload = multer({
  storage: multerStorage,
  fileFilter:multerFilter
})

exports.uploadUserPhoto=upload.single('photo');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {}
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el]
  })
  return newObj
}

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id
  next()
}

exports.updateMe = catchAsync(async (req, res, next) => {
  //create error if user tries to update password
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates!', 400))
  }

  //update user document
  const filteredBody = filterObj(req.body, 'name', 'email')
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true })

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  })

})

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false })

  res.status(204).json({
    status: 'success',
    data: null
  })
})

exports.getUser = factory.getOne(User)

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined! Please use the /signup route.',
  });
};

//not for updating passwords
exports.updateUser = factory.updateOne(User)
exports.deleteUser = factory.deleteOne(User)
exports.getAllUsers = factory.getAll(User)