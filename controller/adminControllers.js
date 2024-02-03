const Admin = require('../model/adminModel')
const bcrypt = require('bcryptjs')
const Order = require('../model/orderModel')
const Product = require('../model/productModel')
const User = require('../model/userModel')

// =====================ADMIN HOMEPAGE======================================

const loadHomepage = async (req, res) => {
  try {
    const users = await User.find({ isListed: false })
    const products = await Product.find({ blocked: false })
    const tot_order = await Order.find()
    const sales = await Order.countDocuments({
      'products.orderStatus': 'Delivered'
    })
    const codCount = await Order.countDocuments({
      'products.orderStatus': 'Delivered',
      paymentMethod: 'COD'
    })
    const onlinePaymentCount = await Order.countDocuments({
      'products.orderStatus': 'Delivered',
      paymentMethod: 'online'
    })
    const walletCount = await Order.countDocuments({
      'products.orderStatus': 'Delivered',
      paymentMethod: 'wallet'
    })

    const monthlyOrderCounts = await Order.aggregate([
      {
        $match: {
          'products.orderStatus': 'Delivered'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%m', date: '$expectedDelivery' } },
          count: { $sum: 1 }
        }
      }
    ])

    const monthRev = await Order.aggregate([
      {
        $match: {
          'products.orderStatus': 'Delivered'
        }
      },
      {
        $project: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          totalAmount: 1
        }
      },
      {
        $group: {
          _id: { year: '$year', month: '$month' },
          totalRevenue: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1
        }
      }
    ])
    const monRev = monthRev.length > 0 && monthRev[0].totalRevenue !== undefined ? monthRev[0].totalRevenue : 0;

    const totalRev = await Order.aggregate([
      {
        $match: {
          'products.orderStatus': 'Delivered'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ])
    const totalRevenue = totalRev[0]?.totalRevenue || 0;
    res.render('admin-homepage', {
      users,
      products,
      tot_order,
      totalRevenue,
      monRev,
      sales,
      codCount,
      walletCount,
      onlinePaymentCount,
      monthlyOrderCounts
    })
  } catch (error) {
	console.log('w',error);
    res.render('500')
  }
}


// =====================ADMIN LOGIN======================

const loadLogin = async (req, res) => {
  try {
    res.render('admin-login')
  } catch (error) {
	console.log(error);
    res.render('500')
  }
}

// =====================ADMIN VERIFYING======================================

const loginVerify = async (req, res) => {
  try {
	
    const email = req.body.email
    const password = req.body.password
	
    const adminData = await Admin.findOne({ email: email })
    if (adminData) {
		
      const passwordMatch = await bcrypt.compare(password, adminData.password)
      if (passwordMatch) {
		
        req.session.Admin = true
		console.log('kk');
        res.redirect('/admin/homepage')
      } else {
		
        res.render('admin-login', { message: 'password was incorrect' })
      }
    } else {
		console.log('err11');
      res.render('admin-login', { message: 'email was incorrect' })
    }
  } catch (error) {
	console.log(error);
    res.render('500')
  }
}

// ==============CATEGORY PAGE======================================

const loadaddCategory = (req, res) => {
  try {
    res.render('add-category')
  } catch (error) {
    res.render('500')
  }
}

// =====================ADMIN LOGOUT==================================

const logOut = async (req, res) => {
  try {
    req.session.Admin = false
    res.redirect('/admin')
  } catch (error) {
    res.render('500')
  }
}
//  =============================OEDER=====================================

const loadOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('products.productId')
    const productWiseOrdersArray = []
    for (const order of orders) {
      for (const productInfo of order.products) {
        const productId = productInfo.productId

        const product = await Product.findById(productId).select(
          'name image price'
        )
        const userDetails = await User.findById(order.userId).select('email')
        if (product) {
          productWiseOrdersArray.push({
            user: userDetails,
            product: product,
            orderDetails: {
              _id: order._id,
              userId: order.userId,
              deliveryDetails: order.deliveryDetails,
              date: order.date,
              totalAmount: productInfo.quantity * product.price,
              orderStatus: productInfo.orderStatus,
              statusLevel: productInfo.statusLevel,
              paymentStatus: productInfo.paymentStatus,
              paymentMethod: order.paymentMethod,
              quantity: productInfo.quantity
            }
          })
        }
      }
    }

    res.render('view-orders', { orders: productWiseOrdersArray })
  } catch (error) {
    res.render('500')
  }
}
// =====================ORDER DETAILS====================================

const orderDetails = async (req, res) => {
  try {
    const id = req.query.id

    const orderedProducts = await Order.findOne({ _id: id }).populate(
      'products.productId'
    )

    res.render('order-details', { orders: orderedProducts })
  } catch (error) {
    res.render('500')
  }
}

// =====================UPDATE ORDER===============================

const updateOrder = async (req, res) => {
  try {
    const order_id = req.body.orderId
    const orderStatus = req.body.status
    const user_id = req.session.user_id
    if (orderStatus == 'cancel') {
      const orderData = await Order.findOneAndUpdate(
        { _id: order_id },
        {
          $set: {
            status: orderStatus,
            cancelReason: 'There was a problem in youre order'
          }
        }
      )

      for (let i = 0; i < orderData.products.length; i++) {
        let product = orderData.products[i].productId
        let quantity = orderData.products[i].quantity
        await Product.updateOne({ _id: product }, { $inc: { stock: quantity } })
      }
    } else {
      const OrderData = await Order.findOneAndUpdate(
        { _id: order_id },
        { $set: { status: orderStatus } }
      )
    }

    res.json({ update: true })
  } catch (error) {
    res.render('500')
  }
}

// =====================ORDER MANAGEMENT======================================

const orderManagement = async (req, res) => {
  try {
    const { orderId, productId } = req.query

    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).render('error-404')
    }
    const productInfo = order.products.find(
      product => product.productId.toString() === productId
    )
    const product = await Product.findById(productId).select('name image price')
    const productOrder = {
      orderId: order._id,
      product: product,
      orderDetails: {
        _id: order._id,
        userId: order.userId,
        deliveryDetails: order.deliveryDetails,
        date: order.date,
        totalAmount: order.totalAmount,
        orderStatus: productInfo.orderStatus,
        statusLevel: productInfo.statusLevel,
        paymentStatus: productInfo.paymentStatus,
        paymentMethod: order.paymentMethod,
        quantity: productInfo.quantity
      }
    }

    res.render('order-management', {
      product: productOrder,
      orderId,
      productId
    })
  } catch (error) {
    res.render('500')
  }
}

// ===========ORDER CHANGE STATUS=================================

const changeStatus = async (req, res) => {
  try {
    const { status, orderId, productId } = req.body
    const order = await Order.findById(orderId)
    const productinfo = order.products.find(
      product => product.productId === productId
    )
    const statusMap = {
      Shipped: 2,
      outfordelivery: 3,
      Delivered: 4
    }

    const selectedStatus = status
    const statusLevel = statusMap[selectedStatus]
    productinfo.orderStatus = status
    productinfo.statusLevel = statusLevel
    productinfo.updatedAt = Date.now()
	if(status=='Delivered'){
		console.log('comes to the function');
		productinfo.returnDate=Date.now()
		
	}
	
    const result = await order.save()
    res.redirect(
      `/admin/order-managment?orderId=${orderId}&productId=${productId}`
    )
  } catch (error) {
    res.render('500')
  }
}
// =====================CANCEL ORDER======================================

const cancelOrderadmin = async (req, res) => {
  try {
    const proId = req.body.productId
    const orderId = req.body.orderId
    const order = await Order.findOne({ _id: orderId })
    const productInfo = order.products.find(
      product => product.productId === proId
    )

    productInfo.orderStatus = 'Cancelled'
    productInfo.paymentStatus = 'Refunded'
    productInfo.updatedAt = Date.now()
    const result = await order.save()

    const quantity = productInfo.quantity
    const productId = productInfo.productId

    const updateQuantity = await Product.findByIdAndUpdate(
      { _id: productId },
      { $inc: { stock: quantity } }
    )
    res.json({ cancel: true })
  } catch (error) {
    res.render('500')
  }
}

// =====================ERROR PAGE==================================

const errorrPage = async (req, res) => {
  try {
    res.render('404')
  } catch (error) {
  }
}

module.exports = {
  loadLogin,
  loginVerify,
  loadHomepage,
  loadaddCategory,
  logOut,
  loadOrders,
  orderDetails,
  orderManagement,
  changeStatus,
  cancelOrderadmin,
  errorrPage
}
