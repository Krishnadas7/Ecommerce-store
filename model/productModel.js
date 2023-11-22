const mongoose=require('mongoose')
const productSchema=new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    brand:{
        type:String,
        required:true
    },
    discount: {
        type: Number,
        default: 0
    },
    discountedAmount: {
        type: Number,
        default: 0
    },
    image:{
        type:Array,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Category",
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    stock:{
        type:Number,
        required:true
    },
    
    blocked:{
        type:Boolean,
        default:false,
        required:true
    }
})

module.exports=mongoose.model('Product',productSchema)