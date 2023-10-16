const express=require('express')
const adminRouter=express()
const adminControllers=require('../controller/adminControllers') 
const category=require('../controller/categoryController')
const userManagement=require('../controller/userManagement')
const productManagement=require('../controller/productManagement')
const adminAuth=require('../middlewares/adminAuth')

const session=require('express-session')
const config=require('../config/config')
adminRouter.use(session({
  secret:config.sessionSecret,
  resave:false,
  saveUninitialized:true
}))

adminRouter.set('view engine','ejs')
adminRouter.set('views','./view/admin')

 const multer=require('multer')
 const path = require('path')
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
      file.mimetype == "image/webp" 
      
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Only .png, .jpg and .jpeg .webp format allowed!"));
    }
  },
});
 


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
adminRouter.post('/add-product',upload.array("image",2),productManagement.addProduct)

// edit product
adminRouter.get('/edit-product',upload.array("image",2),productManagement.editProduct)

// post edit product
adminRouter.post('/edit-product',upload.array("image",2),productManagement.updateProduct)

// product list and unlist
adminRouter.get('/blockunblock',adminAuth.isLogin,productManagement.listUnlist)

// logout
adminRouter.get('/logout',adminControllers.logOut)
   



module.exports=adminRouter