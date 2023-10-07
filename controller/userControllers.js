const { log } = require("console");
const bcrypt=require('bcrypt')
const User=require('../model/userModel')

const securePassword= async(password)=>{
    try {
        const passwordHash=await bcrypt.hash(password,10)
        return passwordHash
    } catch (error) {
        console.log(error.message);
    }
}

const loadSignup=async(req,res)=>{
    try{
     res.render('signup')
    }catch(error){
        console.log(error.message);
    }
}
const insertUser=async (req,res)=>{
    
    const spassword=await securePassword(req.body.password)
    
    try {
        const user=new User({
            name:req.body.name,
            email:req.body.email,
            mobile:req.body.mobile,
            password:spassword,
        
        })
        const userData=await user.save()
        console.log(userData);
        if(userData){
            res.render('login',{message:"your registration was successfully"})
        }else{
            res.render('signup',{message:"your regitration was failed"})
        }
    } catch (error) {
        console.log(error.message);
    }
}

const loadLogin=async (req,res)=>{
    try {
        res.render('login')
    } catch (error) {
        console.log(error.message);
    }
}
const loginVerify=async (req,res)=>{
    try {
        const email=req.body.email
        const password=req.body.password
        const userData=await User.findOne({email:email})
        console.log("userdata "+userData);
        if(userData){
            const passwordMatch=await bcrypt.compare(password,userData.password)
            if(passwordMatch){
                console.log('password matched');
                res.redirect('/')
            }else{
                console.log('password is not matched');
                res.render('login',{message:"password is incorrect"})
            }
        }else{
            console.log('email is not matched');
            res.render('login',{message:"incorrect your email address"})
        }
        
    } catch (error) {
        console.log(error.message);
    }
}
const loadHome =async (req,res)=>{
   
    try {
          res.render('home')
    } catch (error) {
        
    }
}


module.exports={
    loadSignup,
    loadLogin,
    insertUser,
    loginVerify,
    loadHome
}