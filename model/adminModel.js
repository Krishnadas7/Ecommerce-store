const mongoose=require('mongoose')

const adminSchema=new mongoose.Schema({
    email:{
        type:String,
        requred:true
    },
    password:{
        type:String,
        required:true
    }
})
module.exports=mongoose.model('Admin',adminSchema)