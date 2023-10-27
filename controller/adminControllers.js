const Admin=require('../model/adminModel')
const bcrypt=require('bcrypt')


    //    LOAD ADMIN LOGIN

    
const loadLogin=async (req,res)=>{
    try {
        
        res.render('admin-login')
    } catch (error) {
        console.log(error);
    }
}
            // ADMIN CHECKING


const loginVerify=async (req,res)=>{
    try {
         const email=req.body.email
         const password=req.body.password
         const adminData=await Admin.findOne({email:email})
         if(adminData){
            const passwordMatch=await bcrypt.compare(password,adminData.password)
            if(passwordMatch){
                req.session.Admin=true
                res.redirect('/admin/homepage')
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
         // LOAD ADMIN HOMEPAGE


const loadHomepage=(req,res)=>{
    try {
        res.render('admin-homepage')
    } catch (error) {
       console.log(error); 
    }
}
             // LOAD CATEGORY PAGE


const loadaddCategory=(req,res)=>{
    try {
        res.render('add-category')
    } catch (error) {
        console.log(error);
    }
}
             // LOAD ADMIN LOGOUT


const logOut=async (req,res)=>{
    try {
        req.session.Admin=false
        res.redirect('/admin')
    } catch (error) {
        console.log(error);
    }
}
module.exports={
    loadLogin,
    loginVerify,
    loadHomepage,
    loadaddCategory,
    logOut

}