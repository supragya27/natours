const express = require('express')
const reviewController = require('./../controllers/reviewController')
const authController = require('./../controllers/authControllers')

const router = express.Router();

router.route('/').get(reviewController.getAllReviews)
    .post(authController.protect, authController.restrictTo('user'), reviewController.createReview)

router

module.exports = router