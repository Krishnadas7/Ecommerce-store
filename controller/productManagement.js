const { findById, findByIdAndUpdate } = require('../model/adminModel')
const Product = require('../model/productModel')
const Category = require('../model/categoryModel')
const { ObjectId } = require('mongodb')

// ================LOAD PRODUCT============================

const loadProduct = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const pageSize = parseInt(req.query.pageSize) || 8

    let search = ''
    if (req.query.search) {
      search = req.query.search
    }

    const skip = (page - 1) * pageSize

    const totalProducts = await Product.countDocuments({
      $or: [{ name: { $regex: new RegExp(search, 'i') } }]
    })

    const totalPages = Math.ceil(totalProducts / pageSize)

    const products = await Product.find({
      $or: [{ name: { $regex: new RegExp(search, 'i') } }]
    })
      .skip(skip)
      .limit(pageSize)

    res.render('view-products', {
      product: products,
      currentPage: page,
      pageSize: pageSize,
      totalPages: totalPages
    })
  } catch (error) {
    res.render('500')
  }
}

// ==============LOAD ADD PRODUCT==========================

const loadAddproduct = async (req, res) => {
  try {
    const category = await Category.find()
    res.render('add-product', { category: category })
  } catch (error) {
    res.render('500')
  }
}

// ==============ADD PRODUCT==========================

const addProduct = async (req, res) => {
  try {
    const name = req.body.name
    const category = req.body.category
    const description = req.body.description
    const stock = req.body.stock
    const price = req.body.price
    const brand = req.body.brand

    const image = []
    for (let i = 0; i < req.files.length; i++) {
      image[i] = req.files[i].filename
    }

    const data = new Product({
      name: name,
      category: category,
      description: description,
      stock: stock,
      brand: brand,
      price: price,
      image: image
    })

    const result = await data.save()
    res.redirect('/admin/add-product')
  } catch (error) {
    res.render('500')
  }
}

// ================EDIT PRODUCT========================

const editProduct = async (req, res) => {
  try {
    const id = req.query.id
    const product = await Product.findById({ _id: id })

    res.render('edit-product', { product })
  } catch (error) {
    res.render('500')
  }
}

// =================UPDATE PRODUCT=======================

const updateProduct = async (req, res) => {
  try {
    const { id, name, category, stock, description, price } = req.body
    const existingProduct = await Product.findById(id)

    let newImages = existingProduct.image
    if (req.files.length > 0) {
      newImages = req.files.map(file => file.filename)
    }

    const result = await Product.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          name: name,
          category: category,
          description: description,
          price: price,
          stock: stock,
          image: newImages
        }
      }
    )

    if (result) {
      res.redirect('/admin/view-products')
    } else {
      res.render('edit-product')
    }
  } catch (error) {
    res.render('500')
  }
}

// ==============BLOCK AND UNBLOCK==========================

const listUnlist = async (req, res) => {
  try {
    const id = req.query.id
    const product = await Product.findById({ _id: id })

    if (product.blocked === true) {
      const list = await Product.findByIdAndUpdate(
        { _id: id },
        { $set: { blocked: false } }
      )
    } else {
      const list = await Product.findByIdAndUpdate(
        { _id: id },
        { $set: { blocked: true } }
      )
    }
    res.redirect('/admin/view-products')
  } catch (error) {
    res.render('500')
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
