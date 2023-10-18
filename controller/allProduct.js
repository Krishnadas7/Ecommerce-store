const Product=require('../model/productModel')
const Category=require('../model/categoryModel')

const loadallProduct=async (req,res)=>{
    try {
        const category=await Category.find({isListed:true})
        const product=await Product.find({blocked:false})
        console.log(category);
        
        res.render('all-product',{user:req.session.user,product:product,category:category})
    } catch (error) {
        console.log(error);
    }
}

const productView=async (req,res)=>{
    try {
        console.log(req.query.id);
        const id=req.query.id
        const product=await Product.findById({_id:id})
        res.render('product-view',{user:req.session.user,product:product})
    } catch (error) {
        console.log(error);
    }
}

const formalShoes=(req,res)=>{
    try {
        console.log('formal');
        res.render('all-product')
    } catch (error) {
        console.log(error);
    }
}

module.exports={
    loadallProduct,
    productView,
    formalShoes

}