const Product = require('../model/productModel')
const Category = require('../model/categoryModel')

// ============LOAD OFFEERS============================
const loadOffers = async (req, res) => {
  try {
    res.render('offers')
  } catch (error) {
    res.render('500')
  }
}

// =============LOAD PRODUCT OFFRES===========================

const loadProductOffers = async (req, res) => {
  try {
    const nonOffer = await Product.find({ blocked: false })
    const offer = await Product.find({ blocked: false, discount: { $gt: 0 } })

    res.render('product-offers', { nonOffer: nonOffer, offer: offer })
  } catch (error) {
    res.render('500')
  }
}
function calculateDiscountedPrice (originalPrice, discountPercentage) {
  const discountAmount = (discountPercentage / 100) * originalPrice

  const discountedPrice = originalPrice - discountAmount
  return parseFloat(discountedPrice.toFixed(2))
}

const addProductOffer = async (req, res) => {
  try {
    const productId = req.body.productId
    const discountAmount = req.body.discount

    const product = await Product.findById(productId)
    const originalPrice = product.price
    const discountedAmount = calculateDiscountedPrice(
      originalPrice,
      discountAmount
    )
    product.discountedAmount = discountedAmount

    product.discount = discountAmount
    await product.save()

    res.redirect('/admin/product-offers')
  } catch (error) {
    res.render('500')
  }
}

// =============REMOVE OFFER===========================

const removeOffer = async (req, res) => {
  try {
    const productId = req.body.productId
    const product = await Product.findByIdAndUpdate(
      { _id: productId },
      {
        $set: { discount: 0, discountedAmount: 0 }
      }
    )
    res.json({ success: true })
  } catch (error) {
    res.render('500')
  }
}

// =============LOAD CATEFORY OFFER===========================

const loadCategoryOffer = async (req, res) => {
  try {
    const category = await Category.find({ isListed: true })

    const offer = await Category.find({ isListed: true, offer: { $gt: 0 } })

    res.render('category-offers', { Category: category, offer: offer })
  } catch (error) {
    res.render('500')
  }
}

// ==============ADD CATEGORY==========================

const addCategoryOffer = async (req, res) => {
  try {
    const catId = req.body.CatId
    const discount = req.body.discount

    const categoryItem = await Category.findOne({ _id: catId })

    categoryItem.offer = 1

    await categoryItem.save()
    const products = await Product.find({ category: catId })
    for (const product of products) {
      const originalPrice = product.price
      const discountedAmount = calculateDiscountedPrice(originalPrice, discount)

      product.discountedAmount = discountedAmount
      product.discount = discount

      await product.save()
    }

    res.redirect('/admin/category-offers')
  } catch (error) {
    res.render('500')
  }
}

// =================CATEGORY OFFER DELETE=======================

const categoryOfferDelete = async (req, res) => {
  try {
    const categoryId = req.body.categoryId
    const Cat = await Category.findOne({ _id: categoryId })
    Cat.offer = 0
    await Cat.save()

    const result = await Product.updateMany(
      { category: categoryId },
      {
        $set: {
          discount: 0,
          discountedAmount: 0
        }
      }
    )

    res.json({ success: true })
  } catch (error) {
    res.render('500')
  }
}

module.exports = {
  loadOffers,
  loadProductOffers,
  addProductOffer,
  removeOffer,
  loadCategoryOffer,
  addCategoryOffer,
  categoryOfferDelete
}
