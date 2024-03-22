const mongoose=require('mongoose')

const conatactSchema=new mongoose.Schema({
    userId:{
        type:String,
    },
    email:{
        type:String
    },
    message:{
        type:String
    }
})

module.exports=mongoose.model('Contact',conatactSchema)