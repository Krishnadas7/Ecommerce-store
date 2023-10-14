const Category=require('../model/categoryModel')
const mongoose=require('mongoose')
const postCategory=async (req,res)=>{
    try {
        const category=await Category({
            categoryname:req.body.categoryname,
            isListed:true
        })
         
        const result=await category.save()

          res.redirect('/admin/addcategory')
    } catch (error) {
        console.log(error);
    }
}

const loadCategory=async (req,res)=>{
    try {

        const allcategory=await Category.find({})
      

        res.render('view-category',{category:allcategory})
    } catch (error) {
        console.log(error);
    }
}
const editCategory=async (req,res)=>{
    try {
       let id=req.query.id

       const category=await Category.findById({_id:id})

       if(category){
        res.render('edit-category',{category:category})
       }else{
        res.redirect('/admin/viewcategory')
       }
       
    } catch (error) {
        console.log(error);
    }
}

const updateCategory=async (req,res)=>{
    try {
      
        const id=req.body.id
        const updated=await Category.findByIdAndUpdate({_id:id},
            {$set:{categoryname:req.body.categoryname}})
           
            res.redirect('/admin/viewcategory')
    } catch (error) {
        console.log(error);
        }
}




const listUnlist=async(req,res)=>{
    try {
        let id=req.query.id
        console.log(id);
        
        const category=await Category.findById({_id:id})
        if (category.isListed==true) {
            const List=await Category.findByIdAndUpdate({_id:id},{$set:{isListed:false}})
        }else{
            const List=await Category.findByIdAndUpdate({_id:id},{$set:{isListed:true}})
        }
        res.redirect('/admin/viewcategory')

    } catch (error) {
        console.log(error);
    }
}

module.exports={
    postCategory,
    loadCategory,
    editCategory,
    updateCategory,
    listUnlist
}