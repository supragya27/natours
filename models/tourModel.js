const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour without name is not allowed'],
    unique: true,
  },
  rating: {
    type: Number,
    default: 4.5,
  },
  price: {
    type: Number,
    required: [true, 'A price is a must but :p'],
  },
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
