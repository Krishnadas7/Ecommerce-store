const Admin=require('../model/adminModel')
const bcrypt=require('bcrypt')

const loadLogin=async (req,res)=>{
    try {
        
        res.render('admin-login')
    } catch (error) {
        console.log(error);
    }
}
const loginVerify=async (req,res)=>{
    try {
         const email=req.body.email
         const password=req.body.password
         const adminData=await Admin.findOne({email:email})
         if(adminData){
            const passwordMatch=await bcrypt.compare(password,adminData.password)
            if(passwordMatch){
                res.render('admin-homepage')
            }else{
                res.render('admin-login',{message:"password was incorrect"})
            }
         }else{
            res.render('admin-login',{message:"email was incorrect"})
         }
         
          

    } catch (error) {
        console.log(error);
    }
}
const loadHomepage=(req,res)=>{
    try {
        res.render('admin-homepage')
    } catch (error) {
       console.log(error); 
    }
}

const loadaddCategory=(req,res)=>{
    try {
        res.render('add-category')
    } catch (error) {
        console.log(error);
    }
}
module.exports={
    loadLogin,
    loginVerify,
    loadHomepage,
    loadaddCategory
}