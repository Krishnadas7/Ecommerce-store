const Category = require('../model/categoryModel')
const mongoose = require('mongoose')


// ===============LOAD CATEGORY========================

const loadCategory = async (req, res) => {
  try {
    const allcategory = await Category.find({})

    res.render('view-category', { category: allcategory })
  } catch (error) {
    res.render('500')
  }
}
// =============EDIT CATEGORY===========================

const editCategory = async (req, res) => {
  try {
    let id = req.query.id

    const category = await Category.findById({ _id: id })

    if (category) {
      res.render('edit-category', { category: category })
    } else {
      res.redirect('/admin/viewcategory')
    }
  } catch (error) {
    res.render('500')
  }
}

// =============UPDATE CATEGORY===========================
const updateCategory = async (req, res) => {
  try {
    const id = req.body.id;
    const categoryName = req.body.categoryname;

    // Using a case-insensitive query to check if the category already exists
    const already = await Category.findOne({ categoryname: { $regex: new RegExp(categoryName, 'i') } });

    if (already && already._id.toString() !== id) {
      return res.render('add-category',{message:'categoy already is there'});
    }

    // Update the category name
    const updated = await Category.findByIdAndUpdate(
      id,
      { $set: { categoryname: categoryName } },
      { new: true } // Return the updated document
    );

    // if (!updated) {
    //   // Handle the case where the category with the given ID doesn't exist
    //   return res.render('500');
    // }

    res.redirect('/admin/viewcategory');
  } catch (error) {
    // Handle other errors
    console.error(error);
    res.render('500');
  }
};



// =============POST CATEGORY===========================

const postCategory = async (req, res) => {
  try {
    const id = req.body.id
    const categoryname = req.body.categoryname
    const already = await Category.findOne({
      categoryname: { $regex: categoryname, $options: 'i' }
    })
    if (already) {
      res.render('add-Category', { message: 'Category Already Created' })
    } else {
      const data = new Category({
        categoryname: categoryname,
        isListed: true
      })
      const result = await data.save()
      res.redirect('/admin/viewcategory')
    }
  } catch (error) {
    res.render('500')
  }
}

// =============BLOCK AND UNCLOCK===========================

const listUnlist = async (req, res) => {
  try {
    let id = req.query.id

    const category = await Category.findById({ _id: id })
    if (category.isListed === true) {
      const List = await Category.findByIdAndUpdate(
        { _id: id },
        { $set: { isListed: false } }
      )
    } else {
      const List = await Category.findByIdAndUpdate(
        { _id: id },
        { $set: { isListed: true } }
      )
    }
    res.redirect('/admin/viewcategory')
  } catch (error) {
    res.render('500')
  }
}

module.exports = {
  postCategory,
  loadCategory,
  editCategory,
  updateCategory,
  listUnlist
}
