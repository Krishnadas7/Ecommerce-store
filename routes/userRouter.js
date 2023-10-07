const express=require('express')
const userRouter=express()
const userControllers=require('../controller/userControllers')
const path=require('path')
 userRouter.set('view engine','ejs')
 userRouter.set('views','./view/users')

 
userRouter.use(express.json());
userRouter.use(express.urlencoded({ extended: true }));
userRouter.get('/signup',userControllers.loadSignup)
userRouter.post('/signup',userControllers.insertUser)
userRouter.get('/login',userControllers.loadLogin)
userRouter.post('/login',userControllers.loginVerify)
userRouter.get('/',userControllers.loadHome)
module.exports=userRouter