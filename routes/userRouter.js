const express=require('express')
const userRouter=express()
const userControllers=require('../controller/userControllers')
const path=require('path')

// view engine setup
 userRouter.set('view engine','ejs')
 userRouter.set('views','./view/users')


// user session creation
const session=require('express-session')
const config=require('../config/config')
userRouter.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true,
    // cookie: { secure: true }
  }))
 
userRouter.use(express.json());
userRouter.use(express.urlencoded({ extended: true }));
userRouter.get('/signup',userControllers.loadSignup)
userRouter.post('/signup',userControllers.insertUser)
userRouter.get('/login',userControllers.loadLogin)
userRouter.post('/login',userControllers.loginVerify)
userRouter.get('/forgot-password',userControllers.forgotLoad)
userRouter.post('/forgot-password',userControllers.forgotPassword)
userRouter.get('/reset-password',userControllers.resetLoad)
userRouter.post('/reset-password',userControllers.resetPassword)
// otp verification

userRouter.get('/otp-verification',userControllers.showverifyOTPPage)
userRouter.post('/otp-verification',userControllers.verifyOTP)

// homepage rendering
userRouter.get('/',userControllers.loadHome)

module.exports=userRouter