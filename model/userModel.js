const mongoose = require('mongoose')
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    
    },
    email: {
      type: String,
      required: true
    },
    mobile: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },

    isverified: {
      type: Boolean,
      default: true
    },
    token: {
      type: String,
      default: ''
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isListed: {
      type: Boolean,
      default: false
    },
    wallet: {
      type: Number,
      default: 0
    },
    walletHistory: [
      {
        transactionDate: {
          type: Date
        },
        transactionDetails: {
          type: String
        },
        transactionType: {
          type: String
        },
        transactionAmount: {
          type: Number
        }
      }
    ],
    referralCode: {
      type: String,
      unique: true
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('User', userSchema)
