const mongoose=require('mongoose')
const cartSchema=mongoose.Schema({
    user:{
        type : mongoose.Types.ObjectId,
        ref: "User",
        required : true
    },
    applied:{
        type: String,
        default: "not"
      },
    products : [{
        productId :{
            type:String,
            ref : "Product",
            required:true
        },
        quantity:{
            type:Number,
            default:1
        }
    }]   
})

module.exports=mongoose.model('Cart',cartSchema)