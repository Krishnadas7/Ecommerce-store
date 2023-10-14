const express=require('express')
const adminRouter=express()
const adminControllers=require('../controller/adminControllers') 
const category=require('../controller/categoryController')
const userManagement=require('../controller/userManagement')
const productManagement=require('../controller/productManagement')
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
 
adminRouter.set('view engine','ejs')
adminRouter.set('views','./view/admin')


adminRouter.get('/',adminControllers.loadLogin)
adminRouter.post('/login',adminControllers.loginVerify)
adminRouter.get('/homepage',adminControllers.loadHomepage)

// load category

adminRouter.get('/viewcategory',category.loadCategory)


// Add category

adminRouter.get('/addcategory',adminControllers.loadaddCategory)
// post add category
adminRouter.post('/addcategory',category.postCategory)

// edit category

adminRouter.get('/edit-category',category.editCategory)

// update category
adminRouter.post('/edit-category',category.updateCategory)

// list and unlist
adminRouter.get('/list-unlist',category.listUnlist)

// load usermanagement
adminRouter.get('/user-management',userManagement.loadUsermanagement)

// user block and unblock
adminRouter.get('/block-unblock',userManagement.blockUnblock)

// view produtcts
adminRouter.get('/view-products',productManagement.loadProduct)

//load add product
adminRouter.get('/add-product',productManagement.loadAddproduct)

// add product
adminRouter.post('/add-product',upload.array("image",2),productManagement.addProduct)

// edit product
adminRouter.get('/edit-product',upload.array("image",2),productManagement.editProduct)

// post edit product
adminRouter.post('/edit-product',upload.array("image",2),productManagement.updateProduct)

   



module.exports=adminRouter