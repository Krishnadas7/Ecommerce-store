const Product = require('../model/productModel')
const Category = require('../model/categoryModel')
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const User = require('../model/userModel')

const id = new ObjectId()

//===============LOAD SHOP PAGE========================
const loadallProduct = async (req, res) => {
  try {
    const perPage = 12;
    let page = parseInt(req.query.page) || 1;
    const categoryDetails = await Category.find({});

    let search = '';

    if (req.query.search) {
      search = req.query.search;
    }

    const totalProducts = await Product.countDocuments({ blocked: false });
    const totalPages = Math.ceil(totalProducts / perPage);

    // Ensure page is within valid range
    if (page < 1) {
      page = 1;
    } else if (page > totalPages) {
      page = totalPages;
    }

    // Calculate skip value with additional check
    const skipValue = Math.max(0, (page - 1) * perPage);

    const products = await Product.find({
      blocked: false,
      name: { $regex: new RegExp(search, 'i') }
    })
      .skip(skipValue)
      .limit(perPage);

    console.log('Current Page:', page);

    res.render('all-product', {
      category: categoryDetails,
      product: products,
      currentPage: page,
      pages: totalPages,
      user: req.session.user
    });
  } catch (error) {
    console.log(error);
    res.render('500');
  }
};
//===============PRODUCT VIEW==========================
const productView = async (req, res) => {
  try {
    const strictPopulate = false

    const id = req.query.id
    const name = req.session.user
    const userData = await User.findOne({ name: name })
    const userId = userData._id

    const product = await Product.findById({ _id: id }).exec()

    res.render('product-view', {
      user: req.session.user,
      product: product,
      userId: userId
    })
  } catch (error) {
    res.render('500')
  }
}

module.exports = {
  loadallProduct,
  productView
}
