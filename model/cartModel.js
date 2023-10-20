const mongoose=require('mongoose')
const cartSchema=mongoose.Schema({
    user:{
        type : mongoose.Types.ObjectId,
        ref: "User",
        required : true
    },
    products : [{
        productId :{
            type:mongoose.Types.ObjectId,
            ref : "Product",
            required:true
        }
    }]
})

module.exports=mongoose.model('Cart',cartSchema)