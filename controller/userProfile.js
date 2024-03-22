const Address = require('../model/addressModel')
const User = require('../model/userModel')
const { ObjectId } = require('mongodb')
const Cart = require('../model/cartModel')
const Products = require('../model/productModel')
const Category = require('../model/categoryModel')
const bcrypt = require('bcryptjs')
const Coupon = require('../model/couponModel')

// =============SECURE PASSWORD=============================

const securePassword = async password => {
  try {
    const passwordHash = await bcrypt.hash(password, 10)
    return passwordHash
  } catch (error) {
    res.render('500')
  }
}

// ================ADD ADDRESS==========================

const addAddress = async (req, res) => {
  try {
    res.render('add-address', { user: req.session.user })
  } catch (error) {
    res.render('500')
  }
}

// ==============INSERT ADDRESS============================

const insertAddress = async (req, res) => {
  try {
    const name = req.session.user
    const userData = await User.findOne({ name: name })
    const userId = userData._id

    const addressData = await Address.findOne({ user: userId })

    if (addressData) {
      const update = await Address.updateOne(
        { user: userId },
        {
          $push: {
            address: {
              name: req.body.name,
              mobile: req.body.mobile,
              email: req.body.email,
              housename: req.body.housename,
              city: req.body.city,
              state: req.body.state,
              pin: req.body.pin
            }
          }
        }
      )
      res.redirect('/profile')
    } else {
      const data = new Address({
        user: userId,
        address: [
          {
            name: req.body.name,
            mobile: req.body.mobile,
            email: req.body.email,
            housename: req.body.housename,
            city: req.body.city,
            state: req.body.state,
            pin: req.body.pin
          }
        ]
      })
      await data.save()
      res.redirect('/profile')
    }
  } catch (error) {
    res.render('500')
  }
}

// ===============EDIT ADDRESS===========================

const editAddress = async (req, res) => {
  try {
    const addressId = req.query.id
    const name = req.session.user
    const userData = await User.findOne({ name: name })
    const userId = userData._id
    const address = await Address.findOne(
      { user: new ObjectId(userId) },
      { address: { $elemMatch: { _id: new ObjectId(addressId) } } }
    )

    const addres = address.address[0]
    res.render('edit-address', { user: req.session.user, address: addres })
  } catch (error) {
    res.render('500')
  }
}

// ===============UPADATE ADDRESS===========================

const updateAddress = async (req, res) => {
  try {
    const name = req.session.user
    const userData = await User.findOne({ name: name })
    const userId = userData._id
    const addressId = req.body.id

    const details = await Address.updateOne(
      { user: new ObjectId(userId), 'address._id': addressId },
      {
        $set: {
          'address.$.name': req.body.name,
          'address.$.pin': req.body.pin,
          'address.$.city': req.body.city,
          'address.$.mobile': req.body.mobile,
          'address.$.state': req.body.state,
          'address.$.housename': req.body.housename,
          'address.$.email': req.body.email
        }
      }
    )
    res.redirect('/profile')
  } catch (error) {
    res.render('500')
  }
}

// ===============LOAD CHECKOUT===========================

const loadCheckout = async (req, res) => {
  try {
    if (req.session.user) {
      const name = req.session.user
      const userData = await User.findOne({ name: name })
      const userId = userData._id
      const addressData = await Address.findOne({ user: new ObjectId(userId) })
      const cartData = await Cart.findOne({ user: userId }).populate(
        'products.productId'
      )

      const coupons = await Coupon.find({
        status: true,
        expiryDate: { $gte: new Date() }
      })

      let address
      let Products
      if (cartData) {
        Products = cartData.products
      } else {
        Products = []
      }

      if (addressData) {
        address = addressData.address
      }

      let totalPrice = 0
      for (const product of cartData.products) {
        if (product.productId.discount > 0) {
          totalPrice += product.quantity * product.productId.discountedAmount
        } else {
          totalPrice += product.quantity * product.productId.price
        }
      }
      res.render('checkout', {
        user: req.session.user,
        coupons,
        address,
        product: Products,
        total: totalPrice
      })
    } else {
      res.render('checkout', { message: 'user logged' })
    }
  } catch (error) {
    res.render('500')
  }
}

// ================PRODUCT FILTER==========================

const productFilter = async (req, res) => {
  try {
    const perPage = 12
    let page = parseInt(req.query.page) || 1

    let search = ''

    if (req.query.search) {
      search = req.query.search
    }

    const totalProducts = await Products.countDocuments({ blocked: false })
    const totalPages = Math.ceil(totalProducts / perPage)

    if (page < 1) {
      page = 1
    } else if (page > totalPages) {
      page = totalPages
    }

    const products = await Products.find({
      blocked: false,
      name: { $regex: new RegExp(search, 'i') }
    })
      .skip((page - 1) * perPage)
      .limit(perPage)
    let splitPrice
    let minimum
    let maximum

    let price = req.body.price
    if (price) {
      splitPrice = price.split('-')
      minimum = parseInt(splitPrice[0])
      maximum = parseInt(splitPrice[1])
    }

    const sort = parseInt(req.body.sort)
    const category = req.body.category

    const categoryData = await Category.find()
    const productData = await Products.find({
      price: { $gte: minimum, $lte: maximum },
      category: category
    }).sort({ price: sort })
    res.render('all-product', {
      user: req.session.user,
      product: productData,
      category: categoryData,
      currentPage: page,
      pages: totalPages
    })
  } catch (error) {
    res.render('500')
  }
}

// ================RESET PASSWORD==========================

const resetPassword = async (req, res) => {
  try {
    const currentpd = req.body.currentpassword
    const newpd = req.body.newpassword
    const confirmpd = req.body.confirmpassword

    const name = req.session.user
    const userData = await User.findOne({ name: name })
    const userId = userData._id
    const oldpd = userData.password
    if (userData) {
      const passwordMatch = await bcrypt.compare(currentpd, oldpd)

      if (passwordMatch) {
        if (newpd === confirmpd) {
          const secure = await securePassword(newpd)
          const store = await User.updateOne(
            { _id: userId },
            { $set: { password: secure } }
          )

          res.json({ redirect: '/profile' })
        } else {
          res.json({
            newpassworderror: 'New and confirm passwords do not match'
          })
        }
      } else {
        res.json({
          currentpassworderror: 'Old and current passwords do not match'
        })
      }
    } else {
      res.json({ currentpassworderror: 'User not found' })
    }
  } catch (error) {
    res.render('500')
  }
}

// ===============DELETE ADDRESS===========================

const deleteAddress = async (req, res) => {
  try {
    const id = req.body.id
    const name = req.session.user
    const userData = await User.findOne({ name: name })
    const userId = userData._id

    const deleteAddress = await Address.findOneAndUpdate(
      { user: userId },
      {
        $pull: { address: { _id: id } }
      }
    )

    res.json({ delete: true })
  } catch (error) {
    res.render('500')
  }
}
const changeName=async (req,res)=>{
  try {
    
    const name =req.session.user
    const userData=await User.findOne({name:name})
   
    userData.name = req.body.name;
    await userData.save();
    res.json({success:true})
   
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  changeName,
  addAddress,
  insertAddress,
  editAddress,
  updateAddress,
  loadCheckout,
  productFilter,
  resetPassword,
  deleteAddress
}
