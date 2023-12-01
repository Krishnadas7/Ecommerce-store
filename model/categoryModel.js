const mongoose = require('mongoose')

const categorySchema = mongoose.Schema({
  categoryname: {
    type: String,
    required: true
  },
  isListed: {
    type: Boolean,
    required: true
  },
  offer: {
    type: Number,
    default: 0
  }
})

module.exports = mongoose.model('Category', categorySchema)
