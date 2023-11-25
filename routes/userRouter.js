const express=require('express')
const userRouter=express()
const userControllers=require('../controller/userControllers')
const allProduct=require('../controller/allProduct')
const path=require('path')
const userAuth=require('../middlewares/userAuth')
const userProfile=require('../controller/userProfile')
const orderController=require('../controller/orderController')
const cartController=require('../controller/cartController')
const Count=require('../middlewares/cartMiddleware')
const couponController= require('../controller/couponController')
const wishlistController=require('../controller/wishlistController')
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
 userRouter.use(Count)
userRouter.use(express.json());
userRouter.use(express.urlencoded({ extended: true }));

// ============================USERMANAGEMENT=======================================

userRouter.get('/signup',userAuth.isLogout,userControllers.loadSignup)
userRouter.post('/signup',userAuth.isLogout,userControllers.insertUser)
userRouter.get('/login',userAuth.isLogout,userControllers.loadLogin)
userRouter.post('/login',userControllers.loginVerify)
userRouter.get('/forgot-password',userControllers.forgotLoad)
userRouter.post('/forgot-password',userControllers.forgotPassword)
userRouter.get('/reset-password',userControllers.resetLoad)
userRouter.post('/reset-password',userControllers.resetPassword)
userRouter.get('/logout',userControllers.logOut)


// ===============================OTP VERIFICATION==================================================

userRouter.get('/otp-verification',userAuth.isLogout,userControllers.showverifyOTPPage)
userRouter.post('/otp-verification',userAuth.isLogout,userControllers.verifyOTP)
userRouter.get('/resend-otp',userAuth.isLogout,userControllers.resendOtp)

// homepage rendering
userRouter.get('/',userControllers.loadHome)

// =============================LOAD PRODUCT PAGE======================================================

userRouter.get('/all-product',userAuth.isLogin,allProduct.loadallProduct)
userRouter.get('/product-view',userAuth.isLogin,allProduct.productView)
// ================================FILTER===================================

userRouter.post('/filter',userAuth.isLogin,userProfile.productFilter)




// load contact page
userRouter.get('/contact',userAuth.isLogin,userControllers.loadContact)

//  ==================================CARTMANAGEMENT=====================================================

userRouter.post('/add-to-cart',userAuth.isLogin,cartController.addToCart)
userRouter.get('/view-cart',userAuth.isLogin,cartController.getCartProducts)
userRouter.post('/cart-quantity',userAuth.isLogin,cartController.cartQuantity)
userRouter.post('/remove-product',userAuth.isLogin,cartController.removeProduct)



// load user profile page
userRouter.get('/profile',userAuth.isLogin,userControllers.viewProfile)



// ================================USERPROFILE===================================

userRouter.get('/new-address',userAuth.isLogin,userProfile.addAddress)
userRouter.post('/new-address',userAuth.isLogin,userProfile.insertAddress)
userRouter.get('/edit-address',userAuth.isLogin,userProfile.editAddress)
userRouter.post('/edit-address',userAuth.isLogin,userProfile.updateAddress)
userRouter.post('/profile',userAuth.isLogin,userProfile.resetPassword)

// ================================ORDER==================================================

userRouter.get('/checkout',userAuth.isLogin,userProfile.loadCheckout)
userRouter.post('/place-order',userAuth.isLogin,orderController.placeOrder)
userRouter.get('/order-placed',userAuth.isLogin,orderController.orderSuccess)
userRouter.post('/checkout-address',userAuth.isLogin,orderController.checkoutAddress)
// userRouter.get('/order-details',userAuth.isLogin,orderController.loadDetails)
userRouter.post('/cancel-order',userAuth.isLogin,orderController.cancelOrder)
userRouter.post('/delete-address',userProfile.deleteAddress)
userRouter.get('/order-details',userAuth.isLogin,orderController.loadOrderDetails)
userRouter.post('/return-order',userAuth.isLogin,orderController.returnOrder)


// ===============================RESET PASSWORD=============================================

userRouter.post('/profile-password',userAuth.isLogin,userProfile.resetPassword)

userRouter.post('/verify-payment',userAuth.isLogin,orderController.verifyPayment)


userRouter.get('/all-orders',userAuth.isLogin,orderController.allOrders)

// ==================================WALLET=================================================

userRouter.get('/view-wallet',userAuth.isLogin,userControllers.loadWallet)
userRouter.post('/add-wallet',userAuth.isLogin,userControllers.addMoneyWallet)
userRouter.post('/verifyWalletpayment',userAuth.isLogin,userControllers.verifyWalletpayment)
userRouter.get('/wallet-history',userAuth.isLogin,userControllers.loadHistory)

userRouter.post('/applyCoupon',userAuth.isLogin,couponController.applyCoupon)
userRouter.post('/deleteAppliedCoupon',userAuth.isLogin,couponController.deleteAppliedCoupon)

// ====================================WISHLIST========================================================

userRouter.get('/view-wishlist',userAuth.isLogin,wishlistController.loadWishlist)
userRouter.post('/add-to-wishlist',userAuth.isLogin,wishlistController.addWishlist)
userRouter.post('/remove-wishlist',userAuth.isLogin,wishlistController.removeWishlist)



module.exports=userRouter