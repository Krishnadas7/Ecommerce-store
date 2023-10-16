const mongoose=require('mongoose')
const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true

    },
    mobile:{
        type:String,
        required:true  
    },
    password:{
        type:String,
        required:true
    },
    
    isverified:{
        type:Boolean,
        default:0
    },
    token:{
     type:String,
     default:''
    },
    createdAt: {
        type: Date,
        default: Date.now,
      },
      isListed:{
        type:Boolean,
        default:0
    },
},
    {
        timestamps:true
    }

    // ,
    // is_admin:{
    //     type:Number,
  //     default:0
    // }
)

module.exports=mongoose.model('User',userSchema)