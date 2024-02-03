const { log, count } = require('console')
const bcrypt = require('bcryptjs')
const User = require('../model/userModel')
const nodemailer = require('nodemailer')
const otpGenerator = require('otp-generator')
const randomstring = require('randomstring')
const config = require('../config/config')
const Product = require('../model/productModel')
const Cart = require('../model/cartModel')
const Address = require('../model/addressModel')
const { ObjectId } = require('mongodb')
const Order = require('../model/orderModel')
const Coupon = require('../model/couponModel')
const Refferal = require('../model/refferalModel')
const Banner = require('../model/banner')
const Category=require('../model/categoryModel')
const Contact=require('../model/contactModel')


const dotenv = require('dotenv')
dotenv.config()

const mongoose = require('mongoose')
function isValidObjectId (id) {
  return mongoose.Types.ObjectId.isValid(id)
}
const Razorpay = require('razorpay')
const crypto = require('crypto')
const { tryCatch } = require('engine/utils')


const instance = new Razorpay({
  key_id:process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET
})

// ==============SECURE PASSWORD============================

const securePassword = async password => {
  try {
    const passwordHash = await bcrypt.hash(password, 10)
    return passwordHash
  } catch (error) {
    res.render('500')
  }
}
// ===================OTP GENERATION====================================

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const sendVerifyMail = async (name, email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.userEmail,
        pass: config.userPassword
      },
      debug: true,
    })
    const mailoptions = {
      from: 'skrishnadas38@gmail.com',
      to: email,
      subject: 'Verification Mail',
      html:
        '<div style="text-align: center; background-color: Ivory; height: 200px;">' +
        '<h2 style="color:red;">Welcome to Branded</h2>' +
        '<h3>Hello, <b>' +
        name +
        '</b>Thank you for joining us. Your OTP is : </h3>' +
        '<div style="vertical-align: center;"><h1 style="color: blue;">' +
        otp +
        '</h1></div>' +
        '</div>'
    }

    transporter.sendMail(mailoptions, (error, info) => {
      if (error) {
        console.log('errorr',error);
      } else {
      }
    })
  } catch (error) {
    // res.render('500')
  }
}

// ====================RESET MAIL===================================

const sendResetPasswordMail = async (name, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.userEmail,
        pass: config.userPassword
      }
    })
    const mailoptions = {
      from: config.userEmail,
      to: email,
      subject: 'For reset password',
      html:
        '<p>Hii ' +
        name +
        ', please click here to  <a href="http://127.0.0.1:3000/reset-password?token=' +
        token +
        '"> Reset  </a> your password'
    }

    transporter.sendMail(mailoptions, (error, info) => {
      if (error) {
        res.render('500')
      } else {
      }
    })
  } catch (error) {
    res.render('500')
  }
}

// ==================RESEND OTP=====================================

const resendOtp = (req, res) => {
  try {
    const currentTime = Date.now() / 1000

    if (req.session.otp.expire != null) {
      if (currentTime > req.session.otp.expire) {
        const newDigit = otpGenerator.generate(6, {
          digits: true,
          alphabets: false,
          specialChars: false,
          upperCaseAlphabets: false,
          lowerCaseAlphabets: false
        })
        req.session.otp.code = newDigit
        const newExpiry = currentTime + 30

        req.session.otp.expire = newExpiry
        sendVerifyMail(
          req.session.name,
          req.session.email,
          req.session.otp.code
        )
        res.render('otp-verification', {
          message: `New OTP send to ${req.session.email}`
        })
      } else {
        res.render('otp-verification', {
          message: `OTP send to ${req.session.email}, resend after 30 second`
        })
      }
    } else {
      res.send('Already registered')
    }
  } catch (error) {
    res.render('500')
  }
}

// =================LOAD SIGNUP======================================

const loadSignup = async (req, res) => {
  try {
    res.render('signup')
  } catch (error) {
    res.render('500')
  }
}

// ====================INSERT USER===================================

const insertUser = async (req, res) => {
  try {
    const otpDigit = otpGenerator.generate(6, {
      digits: true,
      alphabets: false,
      specialChars: false,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false
    })
    const creationTime = Date.now() / 1000
    const expirationTime = creationTime + 30

    const userCheck = await User.findOne({ email: req.body.email })
    if (userCheck) {
      res.render('signup', { message: 'user already exist' })
    } else {
      const userMob = await User.findOne({ mobile: req.body.mobile })
      if (userMob) {
        res.render('signup', { message: 'Mobile number already exist' })
      } else {
        const spassword = await securePassword(req.body.password)
        req.session.refferalCode = req.body.refferalCode
        req.session.name = req.body.name
        req.session.email = req.body.email
        req.session.mobile = req.body.mobile
        if (req.body.name && req.body.email) {
          if (req.body.password === req.body.confirmpassword) {
            req.session.password = spassword
            req.session.otp = {
              code: otpDigit,
              expire: expirationTime
            }

            sendVerifyMail(
              req.session.name,
              req.session.email,
              req.session.otp.code
            )

            res.render('otp-verification')
          } else {
            res.render('signup', { message: "Password doesn't match" })
          }
        } else {
          res.render('signup', { message: 'Please enter all details' })
        }
      }
    }
  } catch (error) {
    res.render('500')
  }
}

// =================LOAD LOGIN======================================

const loadLogin = async (req, res) => {
  try {
    res.render('login')
  } catch (error) {
    res.render('500')
  }
}

// ====================OTP VERIFY PAGE===================================

const showverifyOTPPage = async (req, res) => {
  try {
    res.render('otp-verification')
  } catch (error) {
    res.render('500')
  }
}

// ====================VERIFY OTP===================================

const verifyOTP = async (req, res) => {
  try {
    function generateReferralCode () {
      const characters =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      let referralCode = ''

      for (let i = 0; i < 8; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length)
        referralCode += characters.charAt(randomIndex)
      }
      return referralCode
    }
    let referralCode = req.session.refferalCode
    const referringUser = await User.findOne({ referralCode })
    const currentTime = Date.now() / 1000
    if (
      req.body.otp === req.session.otp.code &&
      currentTime <= req.session.otp.expire
    ) {
      const user = await User({
        name: req.session.name,
        email: req.session.email,
        mobile: req.session.mobile,
        password: req.session.password,
        referralCode: generateReferralCode(),
        isverified: 1
      })
      await user.save()
      const userId = user._id
      if (referringUser) {
        const referral = new Refferal({
          referralUserId: userId,
          referringUserId: referringUser._id
        })
        await referral.save()

        const result = await User.findOneAndUpdate(
          { _id: userId },
          {
            $inc: { wallet: referral.amount },
            $push: {
              walletHistory: {
                transactionDate: new Date(),
                transactionDetails: 'your Refferal is credited',
                transactionType: 'Credit',
                transactionAmount: referral.amount
              }
            }
          }
        )
        user.wallet += referral.amount
        await user.save()
      }
      res.redirect('/login')
    } else {
      res.render('otp-verification', { message: 'Invalid OTP' })
    }
  } catch (error) {
    res.render('500')
  }
}

// =====================LOGIN VERIFY==================================

const loginVerify = async (req, res) => {
  try {
    const email = req.body.email
    const password = req.body.password
    const userData = await User.findOne({ email: email })

    if (userData) {
      if (userData.isListed == false) {
        const passwordMatch = await bcrypt.compare(password, userData.password)

        if (passwordMatch) {
          if (userData.isverified === false) {
            req.session.User = userData

            res.render('login', { message: 'please verify your email' })
          } else {
            req.session.user = userData.name

            res.redirect('/')
          }
        } else {
          res.render('login', { message: 'password is incorrect' })
        }
      } else {
        res.render('login', { message: 'Blocked' })
      }
    } else {
      res.render('login', { message: 'incorrect your email address' })
    }
  } catch (error) {
    res.render('500')
  }
}

// ===================LOAD HOME====================================

const loadHome = async (req, res) => {

  try {
    const products = await Product.find({ blocked: false }).populate('category').limit(8);

    
    const category=await Category.find({isListed:true})
    const banners = await Banner.find({ status: true })
    if (req.session.user) {
      res.render('home', {
        user: req.session.user,
        products: products,
        banners: banners,
        cat:category
      })
    } else {
      res.render('home', {
        message: 'user logged',
        products: products,
        banners: banners,
        cat:category
      })
    }
  } catch (error) {}
}

// ==================LOGOUT=====================================

const logOut = async (req, res) => {
  try {
    req.session.destroy()
    res.redirect('/')
  } catch (error) {
    res.render('500')
  }
}

const forgotLoad = async (req, res) => {
  try {
    res.render('forgot')
  } catch (error) {
    res.render('500')
  }
}

// =====================FORGOT PASSWORD==================================

const forgotPassword = async (req, res) => {
  try {
    const email = req.body.email
    const userData = await User.findOne({ email: email })
    if (userData) {
      if (userData.isverified === 0) {
        res.render('forgot', { message: 'Please verify your email' })
      } else {
        const randomString = randomstring.generate()
        const updatedData = await User.updateOne(
          { email: email },
          { $set: { token: randomString } }
        )
        sendResetPasswordMail(userData.name, userData.email, randomString)
        res.render('forgot', {
          message: 'Please check your mail to reset your password'
        })
      }
    } else {
      res.render('forgot', { message: 'Please enter correct email' })
    }
  } catch (error) {
    res.render('500')
  }
}

// ====================RESET LOAD===================================

const resetLoad = async (req, res) => {
  try {
    const token = req.query.token

    const tokenData = await User.findOne({ token: token })
    if (tokenData) {
      res.render('reset-password', { user_id: tokenData._id })
    } else {
      res.render('404', { message: 'token invalid' })
    }
  } catch (error) {
    res.render('500')
  }
}

// ==================RESET PASSWORD=====================================

const resetPassword = async (req, res) => {
  try {
    const password = req.body.password
    const user_id = req.body.user_id
    const spassword = await securePassword(password)
    const updatedData = await User.findByIdAndUpdate(
      { _id: user_id },
      { $set: { password: spassword, token: '' } }
    )

    res.redirect('/login')
  } catch (error) {
    res.render('500')
  }
}

// ===================VIEW PROFILE====================================

const viewProfile = async (req, res) => {
  try {
    const name = req.session.user
    const user = await User.findOne({ name: name })
    const userId = user._id
    const userData = await User.findOne({ _id: userId })
    const address = await Address.findOne({ user: userId })
    const orderData = await Order.find({ userId: userId })
    const coupons = await Coupon.find({
      status: true,
      expiryDate: { $gte: new Date() }
    })

    res.render('profile', {
      user: req.session.user,
      data: user,
      address: address,
      name,
      orders: orderData,
      coupons: coupons
    })
  } catch (error) {
    res.render('500')
  }
}

// =====================LOAD CONTACT==================================

const loadContact = async (req, res) => {
  try {
    const user = req.session.User
    res.render('contact', { user: user })
  } catch (error) {
    res.render('500')
  }
}

// ===========================WALLET===================================

const loadWallet = async (req, res) => {
  try {
    const name = req.session.user
    const userData = await User.findOne({ name: name })
    const userId = userData._id

    const wallet = await User.findOne({ _id: userId })

    res.render('wallet', {
      user: req.session.user,
      wallet: wallet
    })
  } catch (error) {
    res.render('500')
  }
}

// ===================ADD WALLET====================================

const addMoneyWallet = async (req, res) => {
  try {
    const amount = req.body.amount
    const parsedAmount = parseInt(amount)

    const id = await crypto.randomBytes(8).toString('hex')

    var options = {
      amount: parsedAmount * 100,
      currency: 'INR',
      receipt: '' + id
    }

    instance.orders.create(options, (err, order) => {
      if (err) {
        res.json({ status: false })
      } else {
        res.json({ status: true, payment: order })
      }
    })
  } catch (error) {
    res.render('500')
  }
}

// =====================VERIFYING==================================

const verifyWalletpayment = async (req, res) => {
  try {
    const name = req.session.user
    const userData = await User.findOne({ name: name })
    const userId = userData._id

    const details = req.body
    const amount = parseInt(details.order.amount) / 100
    let hmac = crypto.createHmac('sha256', process.env.KEY_SECRET)

    hmac.update(
      details.payment.razorpay_order_id +
        '|' +
        details.payment.razorpay_payment_id
    )
    hmac = hmac.digest('hex')
    if (hmac == details.payment.razorpay_signature) {
      const walletHistory = {
        transactionDate: new Date(),
        transactionDetails: 'Deposited via Razorpay',
        transactionType: 'Credit',
        transactionAmount: amount,
        currentBalance: !isNaN(userId.wallet) ? userId.wallet + amount : amount
      }
      await User.findByIdAndUpdate(
        { _id: userId },
        {
          $inc: {
            wallet: amount
          },
          $push: {
            walletHistory
          }
        }
      )
      res.json({ status: true })
    } else {
      res.json({ status: false })
    }
  } catch (error) {
    res.render('500')
  }
}

// =================LOAD HISTORY======================================

const loadHistory = async (req, res) => {
  try {
    const name = req.session.user
    const userData = await User.findOne({ name: name })
    const userId = userData._id
    const details = await User.findOne({ _id: userId })

    res.render('wallet-history', { user: req.session.user, wallet: details })
  } catch (error) {
    res.render('500')
  }
}
const postContact=async (req,res)=>{
  try {
    const name=req.session.user
    const userData= await User.findOne({name:name})
    const userId=userData._id
    const contact=new Contact({
    userId:userId,
    email:req.body.email,
    message:req.body.message
    })
    await contact.save()
    res.json({success:true})
  } catch (error) {
    res.render('500')
  }
}

module.exports = {
  postContact,
  loadSignup,
  loadLogin,
  insertUser,
  loginVerify,
  loadHome,
  logOut,
  verifyOTP,
  showverifyOTPPage,
  resendOtp,
  forgotLoad,
  forgotPassword,
  resetLoad,
  resetPassword,
  viewProfile,
  loadContact,
  loadWallet,
  addMoneyWallet,
  verifyWalletpayment,
  loadHistory
}
