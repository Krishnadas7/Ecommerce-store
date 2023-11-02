const Product=require('../model/productModel')
const Category=require('../model/categoryModel')
const mongoose=require('mongoose')
const ObjectId = mongoose.Types.ObjectId;

const User=require('../model/userModel')

// Now you can use ObjectId in your code
const id = new ObjectId(); 

        //  LOAD SHOP PAGE
        const loadallProduct = async (req, res) => {
          try {
              const perPage = 12;
              let page = parseInt(req.query.page) || 1;
              const categoryDetails = await Category.find({});
      
              let search = ''; // Fix the variable name here
      
              if (req.query.search) {
                  search = req.query.search; // Fix the variable name here
              }
      
              const totalProducts = await Product.countDocuments({ blocked: false });
              const totalPages = Math.ceil(totalProducts / perPage);
      
              if (page < 1) {
                  page = 1;
              } else if (page > totalPages) {
                  page = totalPages;
              }
      
              const products = await Product
                  .find({
                      blocked: false,
                      name: { $regex: new RegExp(search, 'i') }
                  })
                  .skip((page - 1) * perPage)
                  .limit(perPage);
      
              res.render('all-product', {
                  category: categoryDetails,
                  product: products,
                  currentPage: page,
                  pages: totalPages,
                  user: req.session.user
              });
          } catch (error) {
              console.log(error);
          }
      };

          //  ONE PRODUCT DETAILS


const productView=async (req,res)=>{
    try {
        const strictPopulate = false
        console.log(req.query.id);
        const id=req.query.id
        const name=req.session.user
        const userData=await User.findOne({name:name})
        const userId=userData._id
        console.log(userData);

        
        
        const product=await Product.findById({_id:id}).exec()
        console.log('product  :',product);
        res.render('product-view',{user:req.session.user,product:product,userId:userId})
    } catch (error) {
        console.log(error);
    }
}

        



module.exports={
    loadallProduct,
    productView,
    

}