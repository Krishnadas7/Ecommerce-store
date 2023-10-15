const { findById, findByIdAndUpdate } = require('../model/adminModel');
const Product = require('../model/productModel')

const { ObjectId } = require("mongodb")


const loadProduct = async (req, res) => {
    try {

        const product = await Product.find({})
        res.render('view-products', { product: product })
    } catch (error) {
        console.log(error);
    }
}

const loadAddproduct = async (req, res) => {
    try {
        res.render('add-product')
    } catch (error) {
        console.log(error);
    }
}
const addProduct = async (req, res) => {
    try {
        const name = req.body.name
        const category = req.body.category
        const description = req.body.description
        const stock = req.body.stock
        const price = req.body.price

        const image = [];
        for (i = 0; i < req.files.length; i++) {
            image[i] = req.files[i].filename;
        }

        const data = new Product({
            name: name,
            category: category,
            description: description,
            stock: stock,
            price: price,
            image: image
        })

        const result = await data.save()
        console.log(result);
        res.redirect('/admin/add-product')

    } catch (error) {
        console.log(error);
    }
}
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