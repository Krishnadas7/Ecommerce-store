// const mongoose = require("mongoose");
// const ObjectId = mongoose.Types.ObjectId;

// const orderSchema = new mongoose.Schema({
//     deliveryDetails: {
//         type: String,
//         required: true,
//     },
//     user: {
//         type: ObjectId,
//     },
//     paymentMethod: {
//         type: String,
//     },
//     product: [
//     {
//         productId: {
//             type: ObjectId,
//             ref: "Product",
//             required: true,
//         },
//         quantity: {
//             type: Number,
//             required: true,
//         },
//         status : {
//             type : String
//         },
//         reason : {
//             type : String
//         }
//     }],
//     totalAmount: {
//         type: Number,
//     },
//     Date: {
//         type: Date,
//     },
//     status: {
//         type: String,
//     },
//     paymentId :{
//         type : String
//     },
   
//     reason : {
//         type : String
//     },
//     amount :{
//         type : Number
//     }
// },
//   {
//     timestamps: true
//   }
// );


// module.exports = mongoose.model("Order", orderSchema);

const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  deliveryDetails: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Types.ObjectId,
  },
  uniqueId: {
    type: Number,
  },
  userId: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  products: [
    {
      productId: {
        type: String,
        required: true,
        ref: "Product",
      },
      quantity: {
        type: Number,
        default: 1,
      },
      price: {
        type: Number,
        required: true,
      },
      totalPrice: {
        type: Number,
        // required: true,
      }
    },
  ],
  
  deliveryDate: {
    type: Date,
  },
  cancelReason: {
    type: String
  },
  returnReason: {
    type: String
  },
  totalAmount: {
    type: Number,
    // required: true,
  },
  date: {
    type: Date,
  },
  status: {
    type: String,
  },
  paymentMethod: {
    type: String,
  },
  orderId: {
    type: String,
  },
  paymentId: {
    type: String
  },
  discount: {
    type: String
  }
});

module.exports = mongoose.model("order", orderSchema);

