const express=require('express')
const adminRouter=express()
const adminControllers=require('../controller/adminControllers') 
const category=require('../controller/categoryController')
const userManagement=require('../controller/userManagement')
const productManagement=require('../controller/productManagement')
const adminAuth=require('../middlewares/adminAuth')
const couponController=require('../controller/couponController')
const offers=require('../controller/offers')
const reportController=require('../controller/reportController')
const bannerController=require('../controller/bannerController')

const session=require('express-session')
const config=require('../config/config')
adminRouter.use(session({
  secret:config.sessionSecret,
  resave:false,
  saveUninitialized:true
}))
adminRouter.use(express.json());
adminRouter.use(express.urlencoded({ extended: true }));

adminRouter.set('view engine','ejs')
adminRouter.set('views','./view/admin')

 const multer=require('multer')
 const path = require('path')
const { executionAsyncId } = require('async_hooks')

const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname, '../public/adminAssets/product-images'))
    },
    filename:function(req,file,cb){
        const name = Date.now()+'-'+file.originalname;
        cb(null,name)
    }
})


const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg" ||
      file.mimetype == "image/webp" ||
      file.mimetype == "image/avif"
      
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Only .png, .jpg and .jpeg .webp format allowed!"));
    }
  },
});
const uploadImages = (req, res, next) => {
  const uploadMiddleware = upload.array('image', 4);

  uploadMiddleware(req, res, (err) => {
    if (err) {
      // Handle errors
      return res.status(400).json({ error: err.message });
    }
    
    // All images are uploaded successfully
    next();
  });
};
const bannerStorage = multer.diskStorage({
  destination:function(req,file,cb){
      cb(null,path.join(__dirname, '../public/banner'))
  },
  filename:function(req,file,cb){
      const name = Date.now()+'-'+file.originalname;
      cb(null,name)
  }
})

const bannerUpload=multer({storage:bannerStorage})


adminRouter.get('/',adminAuth.isLogout,adminControllers.loadLogin)
adminRouter.post('/',adminAuth.isLogout,adminControllers.loginVerify)
adminRouter.get('/homepage',adminAuth.isLogin,adminControllers.loadHomepage)

// load category

adminRouter.get('/viewcategory',adminAuth.isLogin,category.loadCategory)


// Add category

adminRouter.get('/addcategory',adminAuth.isLogin,adminControllers.loadaddCategory)
// post add category
adminRouter.post('/addcategory',adminAuth.isLogin,category.postCategory)

// edit category

adminRouter.get('/edit-category',adminAuth.isLogin,category.editCategory)

// update category
adminRouter.post('/edit-category',adminAuth.isLogin,category.updateCategory)

// list and unlist
adminRouter.get('/list-unlist',adminAuth.isLogin,category.listUnlist)

// load usermanagement
adminRouter.get('/user-management',adminAuth.isLogin,userManagement.loadUsermanagement)

// user block and unblock
adminRouter.get('/block-unblock',adminAuth.isLogin,userManagement.blockUnblock)

// view produtcts
adminRouter.get('/view-products',adminAuth.isLogin,productManagement.loadProduct)

//load add product
adminRouter.get('/add-product',adminAuth.isLogin,productManagement.loadAddproduct)

// add product
adminRouter.post('/add-product',uploadImages,productManagement.addProduct)

// edit product
adminRouter.get('/edit-product',upload.array("image",4),productManagement.editProduct)

// post edit product
adminRouter.post('/edit-product',upload.array("image",4),productManagement.updateProduct)

// product list and unlist
adminRouter.get('/blockunblock',adminAuth.isLogin,productManagement.listUnlist)

// logout
adminRouter.get('/logout',adminControllers.logOut)

//view orders
adminRouter.get('/orders',adminAuth.isLogin,adminControllers.loadOrders)

//view order details
adminRouter.get('/order-details',adminAuth.isLogin,adminControllers.orderDetails)

// update order
// adminRouter.post('/updateOrder',adminAuth.isLogin,adminControllers.updateOrder)

// ===============================MAANAGEMENT=================================================

adminRouter.get('/order-managment',adminAuth.isLogin,adminControllers.orderManagement)

adminRouter.post('/change-status',adminAuth.isLogin,adminControllers.changeStatus)

adminRouter.post('/cancel-orderitem',adminAuth.isLogin,adminControllers.cancelOrderadmin)

// =================================COUPON==================================================

adminRouter.get('/add-coupon',adminAuth.isLogin,couponController.loadAddCoupon)
adminRouter.get('/view-coupon',adminAuth.isLogin,couponController.viewCoupon)
adminRouter.post('/add-coupon',adminAuth.isLogin,couponController.addCoupon)
adminRouter.get('/block-coupons',adminAuth.isLogin,couponController.blockCoupons)
adminRouter.get('/edit-coupon-page',adminAuth.isLogin,couponController.showEditPage)
adminRouter.post('/edit-coupon',adminAuth.isLogin,couponController.updateCoupon)

// ===============offers======================
adminRouter.get('/offers',adminAuth.isLogin,offers.loadOffers)
adminRouter.get('/product-offers',adminAuth.isLogin,offers.loadProductOffers)
adminRouter.post('/product-offers',adminAuth.isLogin,offers.addProductOffer)
adminRouter.post('/remove-offer',adminAuth.isLogin,offers.removeOffer)
adminRouter.get('/category-offers',adminAuth.isLogin,offers.loadCategoryOffer)
adminRouter.post('/category-offers',adminAuth.isLogin,offers.addCategoryOffer)
adminRouter.post('/remove-Catoffer',adminAuth.isLogin,offers.categoryOfferDelete)
// ===============SALES REPORT===================
adminRouter.get('/sales-report',adminAuth.isLogin,reportController.loadSalesReport)


// =====================BANNER ===============================
adminRouter.get('/add-banner',adminAuth.isLogin,bannerController.loadAddBanner)
adminRouter.post('/add-banner',adminAuth.isLogin,bannerUpload.single('image'),bannerController.postBanner)
adminRouter.get('/banner-detials',adminAuth.isLogin,bannerController.loadBannerDetails)
adminRouter.get('/block-banner',adminAuth.isLogin,bannerController.blockBanner)
adminRouter.get('/edit-banner',adminAuth.isLogin,bannerController.editBanner)
adminRouter.post('/edit-banner',adminAuth.isLogin,bannerUpload.single('image'),bannerController.updateBanner)

// =============================ERROR PAGE==============================================
adminRouter.get('/*',adminControllers.errorrPage)

module.exports=adminRouter