const mongoose=require('mongoose')

const categorySchema=mongoose.Schema({

    // categoryId: {type: String,unique: true,index: true},
    categoryname:{
        type:String,
        required:true
    },
    isListed:{
        type:Boolean,
        required:true
    },
    offer: {
        type: Number,
        default: 0 // or any other default value you prefer
    }
})



module.exports=mongoose.model('Category',categorySchema)