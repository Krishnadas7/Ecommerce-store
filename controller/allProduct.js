const Product=require('../model/productModel')
const Category=require('../model/categoryModel')
const mongoose=require('mongoose')
const ObjectId = mongoose.Types.ObjectId;

// Now you can use ObjectId in your code
const id = new ObjectId(); 
// const loadallProduct=async (req,res)=>{
//     try {
        
//         const product=await Product.find({blocked:false}).exec()
//         const category=await Category.find({isListed:true})
       
//         console.log(product);
        
//         res.render('all-product',{user:req.session.user,product:product,category:category})
//     } catch (error) {
//         console.log(error);
//     }
// }
const loadallProduct = async (req, res) => {
    try {
      const perPage = 12; // Number of products per page
      let page = parseInt(req.query.page) || 1; // Get the page from the request query and parse it as an integer
      const categoryDetails = await Category.find({});
      const totalProducts = await Product.countDocuments({ blocked: false });
      const totalPages = Math.ceil(totalProducts / perPage);
  
      // Ensure that the page is within valid bounds
      if (page < 1) {
        page = 1;
      } else if (page > totalPages) {
        page = totalPages;
      }
  
      const products = await Product
        .find({ blocked: false})
        .skip((page - 1) * perPage)
        .limit(perPage);
  
      res.render('all-product', {
        category: categoryDetails,
        product: products,
        currentPage: page,
        pages: totalPages,
        user:req.session.user
      });
    } catch (error) {
      console.log(error);
    }
  };

const productView=async (req,res)=>{
    try {
        const strictPopulate = false
        console.log(req.query.id);
        const id=req.query.id
        const product=await Product.findById({_id:id}).exec()
        res.render('product-view',{user:req.session.user,product:product})
    } catch (error) {
        console.log(error);
    }
}

const formalShoes=async (req,res)=>{
    try {
        console.log('formal');
        const catagoryId=req.query.id
       
        const product=await Product.find({category:catagoryId}).exec()
        const category=await Category.find({isListed:true})
       
        res.render('all-product',{category:category,product:product,})
    } catch (error) {
        console.log(error);
    }
}

module.exports={
    loadallProduct,
    productView,
    formalShoes

}