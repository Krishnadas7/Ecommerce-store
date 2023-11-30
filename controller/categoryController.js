const Category=require('../model/categoryModel')
const mongoose=require('mongoose')

        // LOAD CATEGORY PAGE

const loadCategory=async (req,res)=>{
    try {

        const allcategory=await Category.find({})
      

        res.render('view-category',{category:allcategory})
    } catch (error) {
        console.log(error);
        res.render('500')
    }
}
                // EDIT CATEGORY PAGE


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
        res.render('500')
    }
}

        // UPDATE CATEGORY


const updateCategory=async (req,res)=>{
    try {
      
        const id=req.body.id
        const already=await Category.findById({_id:id})
        if(already){
            res.render('add-Category',{message : "Category Already Created"})
        }else{
            const updated=await Category.findByIdAndUpdate({_id:id},
                {$set:{categoryname:req.body.categoryname}})
        }
         
           
            res.redirect('/admin/viewcategory')
    } catch (error) {
        console.log(error);
        res.render('500')
        }
}

                     //   INSERT CATEGORY
const postCategory=async (req,res)=>{
    try {
        const id=req.body.id
        const categoryname=req.body.categoryname
        const already=await Category.findOne({categoryname:{$regex:categoryname,'$options':'i'}})
        if(already){
            res.render('add-Category',{message : "Category Already Created"})
        }else{
         const data=new Category({
            categoryname:categoryname,
            isListed:true
         })
         const result=await data.save()
         res.redirect('/admin/viewcategory')
        }
    } catch (error) {
        console.log(error);
        res.render('500')
    }
}

            //   LIST AND UNLIST


const listUnlist=async(req,res)=>{
    try {
        let id=req.query.id
        console.log(id);
        
        const category=await Category.findById({_id:id})
        if (category.isListed===true) {
            const List=await Category.findByIdAndUpdate({_id:id},{$set:{isListed:false}})
        }else{
            const List=await Category.findByIdAndUpdate({_id:id},{$set:{isListed:true}})
        }
        res.redirect('/admin/viewcategory')

    } catch (error) {
        console.log(error);
        res.render('500')
    }
}


module.exports={
    postCategory,
    loadCategory,
    editCategory,
    updateCategory,
    listUnlist
}