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
    image:{
        type:Array,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    category:{
        type:String,
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