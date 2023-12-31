const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema(
  {
    deliveryDetails: {
      type: String,
      required: true
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true
    },

    userId: {
      type: String,
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    products: [
      {
        productId: {
          type: String,
          ref: 'Product',
          required: true
        },
        quantity: {
          type: Number,
          default: 1
        },
        cancelReason: {
          type: String
        },
        price: {
          type: Number,
          required: true
        },
        orderStatus: {
          type: String,
          required: true
        },
        paymentStatus: {
          type: String,
          required: true
        },
        returnDate:{
          type: Date,
          
        },

        statusLevel: {
          type: Number,
          required: true
        },
        cancelReason: {
          type: String
        },
        updatedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    deliveryDate: {
      type: Date
    },

    date: {
      type: Date,
      default: Date.now
    },
    totalAmount: {
      type: Number,
      required: true
    },
    paymentMethod: {
      type: String,
      require: true
    },
    trackId: {
      type: Number,
      require: true
    },
    expectedDelivery: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('order', orderSchema)
