const { findById, findByIdAndUpdate } = require('../model/adminModel');
const Product = require('../model/productModel')
const Category=require('../model/categoryModel')
const { ObjectId } = require("mongodb")

            // ADMIN LOADING PRODUCT PAGE
             
            const loadProduct = async (req, res) => {
                try {
                    const page = parseInt(req.query.page) || 1;
                    const pageSize = parseInt(req.query.pageSize) || 8;
            
                    let search = '';
                    if (req.query.search) {
                        search = req.query.search;
                    }
            
                    const skip = (page - 1) * pageSize;
            
                    // Count the total number of products matching the search criteria
                    const totalProducts = await Product.countDocuments({
                        $or: [{ name: { $regex: new RegExp(search, 'i') } }],
                    });
            
                    const totalPages = Math.ceil(totalProducts / pageSize);
            
                    const products = await Product.find({
                        $or: [{ name: { $regex: new RegExp(search, 'i') } }],
                    })
                        .skip(skip)
                        .limit(pageSize);
            
                    res.render('view-products', {
                        product: products,
                        currentPage: page,
                        pageSize: pageSize,
                        totalPages: totalPages,
                    });
                } catch (error) {
                    console.log(error);
                }
            };

        // LOAD  ADD PRODUCT PAGE

const loadAddproduct = async (req, res) => {
    try {
        const category=await Category.find()
        res.render('add-product',{category:category})
    } catch (error) {
        console.log(error);
    }
}
               //   ADD PRODUCT


               const addProduct = async (req, res) => {
                try {
                    const name = req.body.name;
                    const category = req.body.category;
                    const description = req.body.description;
                    const stock = req.body.stock;
                    const price = req.body.price;
                    const brand = req.body.brand;
            
                    const image = [];
                    for (let i = 0; i < req.files.length; i++) {
                        image[i] = req.files[i].filename;
                    }
            
                    const data = new Product({
                        name: name,
                        category: category,
                        description: description,
                        stock: stock,
                        brand: brand,
                        price: price,
                        image: image
                    });
            
                    const result = await data.save();
                    console.log(result);
                    res.redirect('/admin/add-product');
                } catch (error) {
                    console.error(error);
                   
                }
            };
            

               //    EDIT PRODUCT

const editProduct = async (req, res) => {
    try {
        const id = req.query.id
        const product = await Product.findById({ _id: id })
        console.log(product);

        res.render('edit-product', { product })
    } catch (error) {
        console.log(error);
    }
}
                      // UPDATE PRODUCT                        


const updateProduct = async (req, res) => {
    try {
         const name=req.body.name
         const category=req.body.category
         const stock=req.body.stock
         const description=req.body.description
         const price=req.body.price
         const id=req.body.id
         const image=[]
         for (i = 0; i < req.files.length; i++) {
            image[i] = req.files[i].filename;
          }
         const result =await Product.findByIdAndUpdate({_id:id},{$set:{
            name:name,
            category:category,
            description:description,
            price:price,
            stock:stock,
            image:image

         }})
         if(result){
            res.redirect('/admin/view-products')
         }else{
            res.render('edit-product')
         }


    } catch (error) {
        console.log(error);
    }
}                  

        //    LIST AND UNLIST PRODUCT

   const listUnlist=async (req,res)=>{
    try {
       
         const id=req.query.id
        const product=await Product.findById({_id:id})
          
        if(product.blocked===true){
            const list=await Product.findByIdAndUpdate({_id:id},{$set:{blocked:false}})
        }else{
            const list=await Product.findByIdAndUpdate({_id:id},{$set:{blocked:true}})  
        }
        res.redirect('/admin/view-products')
        
    } catch (error) {
        console.log();
    }
   }

module.exports = {
    loadProduct,
    loadAddproduct,
    addProduct,
    editProduct,
    updateProduct,
    listUnlist

}