const Cart = require('../model/cartModel')
const User = require('../model/userModel')
const Product = require('../model/productModel')
const { ObjectId } = require('mongodb')

// =============ADD TO CART===========================
const addToCart = async (req, res) => {
  try {
    const productId = req.body.id

    const name = req.session.user
    const userData = await User.findOne({ name: name })
    const userId = userData._id
    const productData = await Product.findById(productId)
    const productStock = productData.stock

    const cartData = await Cart.findOneAndUpdate(
      { user: userId },
      {
        $setOnInsert: {
          user: userId,
          products: []
        }
      },
      { upsert: true, new: true }
    )
    const updatedProduct = cartData.products.find(
      product => product.productId === productId
    )

    const updatedQuantity = updatedProduct ? updatedProduct.quantity : 0

    if (updatedQuantity + 1 > productStock) {
      return res.json({
        success: false,
        message: 'Quantity limit reached'
      })
    }
    const price = productData.price
    const total = price
    if (updatedProduct) {
      return res.json({
        already: true
      })
    } else {
      await cartData.products.push({
        productId: productId
      })
      await cartData.save()
    }
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' })
  }
}
function calculateDiscountedPrice (originalPrice, discountPercentage) {
  const discountAmount = (discountPercentage / 100) * originalPrice
  const discountedPrice = originalPrice - discountAmount

  return discountedPrice.toFixed(2)
}

// ===============LOAD CART=========================

const getCartProducts = async (req, res) => {
  try {
    const name = req.session.user
    const userData = await User.findOne({ name: name })
    const userId = userData._id
    const cartData = await Cart.findOne({ user: userId }).populate(
      'products.productId'
    )
    const cart = await Cart.findOne({ user: userId })
    let cartCount = 0
    if (cart) {
      cartCount = cart.products.length
    }
    let totalPrice = 0

    if (cartData) {
      if (cartData.products.length > 0) {
        const products = cartData.products

        for (const product of cartData.products) {
          let total = calculateDiscountedPrice(
            product.productId.price,
            product.productId.discount
          )
          totalPrice += product.quantity * total
        }

        totalPrice = totalPrice.toFixed(2)

        res.render('view-cart', {
          user: req.session.user,
          cart: products,
          count: cartCount,
          userId: userId,
          total: totalPrice
        })
      } else {
        res.render('view-cart', {
          cart: [],
          total: 0,
          user: req.session.user
        })
      }
    } else {
      res.render('view-cart', {
        cart: [],
        total: 0,
        user: req.session.user
      })
    }
  } catch (error) {}
}

// =============CART QUANTITY===========================

const cartQuantity = async (req, res) => {
  try {
    let number = parseInt(req.body.count)
    const proId = req.body.product
    const userId = req.body.user
    const product = await Product.find({ _id: new ObjectId(proId) })

    const count = number
    const cartData = await Cart.findOne(
      { user: new ObjectId(userId), 'products.productId': new ObjectId(proId) },
      { 'products.productId.$': 1, 'products.quantity': 1 }
    )

    const [{ quantity: quantity }] = cartData.products
    const stockAvailable = await Product.find({ _id: new ObjectId(proId) })

    if (stockAvailable[0].stock < quantity + count) {
      res.json({ success: false })
      return
    } else {
      const datat = await Cart.updateOne(
        { user: userId, 'products.productId': proId },
        {
          $inc: { 'products.$.quantity': count }
        }
      )
      res.json({ changeSuccess: true })
    }
  } catch (error) {}
}
// =============REMOCE PRODUCT===========================

const removeProduct = async (req, res) => {
  try {
    const proId = req.body.product

    const user = req.session.user
    const userId = user._id

    const cartData = await Cart.findOneAndUpdate(
      { 'products.productId': proId },
      {
        $pull: { products: { productId: proId } }
      }
    )
    res.json({ removeProduct: true })
  } catch (error) {
    res.json({ success: true })
  }
}

module.exports = {
  removeProduct,
  cartQuantity,
  getCartProducts,
  addToCart
}
