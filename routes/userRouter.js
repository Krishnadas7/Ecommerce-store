const express=require('express')
const userRouter=express()
const userControllers=require('../controller/userControllers')
const allProduct=require('../controller/allProduct')
const path=require('path')
const userAuth=require('../middlewares/userAuth')
const userProfile=require('../controller/userProfile')
const orderController=require('../controller/orderController')
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
userRouter.get('/signup',userAuth.isLogout,userControllers.loadSignup)
userRouter.post('/signup',userAuth.isLogout,userControllers.insertUser)
userRouter.get('/login',userAuth.isLogout,userControllers.loadLogin)
userRouter.post('/login',userControllers.loginVerify)
userRouter.get('/forgot-password',userControllers.forgotLoad)
userRouter.post('/forgot-password',userControllers.forgotPassword)
userRouter.get('/reset-password',userControllers.resetLoad)
userRouter.post('/reset-password',userControllers.resetPassword)
userRouter.get('/logout',userControllers.logOut)
// otp verification

userRouter.get('/otp-verification',userAuth.isLogout,userControllers.showverifyOTPPage)
userRouter.post('/otp-verification',userAuth.isLogout,userControllers.verifyOTP)

userRouter.get('/resend-otp',userAuth.isLogout,userControllers.resendOtp)

// homepage rendering
userRouter.get('/',userControllers.loadHome)

//  user load product page

userRouter.get('/all-product',userAuth.isLogin,allProduct.loadallProduct)

userRouter.get('/product-view',userAuth.isLogin,allProduct.productView)

userRouter.get('/formal-shoes',allProduct.formalShoes)



// load contact page
userRouter.get('/contact',userAuth.isLogin,userControllers.loadContact)

// addto cart

userRouter.post('/add-to-cart',userAuth.isLogin,userControllers.addToCart)

userRouter.get('/view-cart',userAuth.isLogin,userControllers.getCartProducts)

userRouter.post('/cart-quantity',userAuth.isLogin,userControllers.cartQuantity)

userRouter.post('/remove-product',userAuth.isLogin,userControllers.removeProduct)



// load user profile page
userRouter.get('/profile',userAuth.isLogin,userControllers.viewProfile)

userRouter.post('add-address',userAuth.isLogin,userControllers.addAddress)


userRouter.get('/new-address',userAuth.isLogin,userProfile.addAddress)

userRouter.post('/new-address',userAuth.isLogin,userProfile.insertAddress)

userRouter.get('/edit-address',userAuth.isLogin,userProfile.editAddress)

userRouter.post('/edit-address',userAuth.isLogin,userProfile.updateAddress)

userRouter.get('/checkout',userAuth.isLogin,userProfile.loadCheckout)

userRouter.post('/place-order',userAuth.isLogin,orderController.placeOrder)

// userRouter.post('/checkout',userAuth.isLogin,orderController.postCheckout)

// userRouter.post('/checkout/paymentselection',userAuth.isLogin,orderController.itemsAndDelivery)

// userRouter.get('/checkout/paymentselection',userAuth.isLogin,orderController.placeOrder)





module.exports=userRouter