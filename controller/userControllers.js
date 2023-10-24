const { log, count } = require("console");
const bcrypt = require('bcrypt')
const User = require('../model/userModel')
const nodemailer = require("nodemailer")
const otpGenerator = require("otp-generator");
const randomstring = require('randomstring')
const config = require('../config/config')
const Product = require('../model/productModel')
const Cart = require('../model/cartModel')
const { ObjectId } = require("mongodb")

const mongoose = require('mongoose')
function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}



const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash
    } catch (error) {
        console.log(error);
    }
}

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};


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
            }
        });
        const mailoptions = {
            from: "skrishnadas38@gmail.com",
            to: email,
            subject: "Verification Mail",
            html: '<div style="text-align: center; background-color: Ivory; height: 200px;">' +
                '<h2 style="color:red;">Welcome to Branded</h2>' +
                '<h3>Hello, <b>' + name + '</b>Thank you for joining us. Your OTP is : </h3>' +
                '<div style="vertical-align: center;"><h1 style="color: blue;">' + otp + '</h1></div>' +
                '</div>'
        }

        transporter.sendMail(mailoptions, (error, info) => {
            if (error) {
                console.log(error)
            } else {
                console.log("Email has been send", info.response);
            }
        })
    } catch (error) {
        console.log("error", error.message);
    }
}


// reset password sendmail
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
        });
        const mailoptions = {
            from: config.userEmail,
            to: email,
            subject: "For reset password",
            html: '<p>Hii ' + name + ', please click here to  <a href="http://127.0.0.1:3000/reset-password?token=' + token + '"> Reset  </a> your password'
        }

        transporter.sendMail(mailoptions, (error, info) => {
            if (error) {
                console.log(error)
            } else {
                console.log("Email has been send", info.response);
            }
        })
    } catch (error) {
        console.log("error", error.message);
    }
}


//resend OTP
const resendOtp = (req, res) => {
    try {
        const currentTime = Date.now() / 1000;

        if (req.session.otp.expire != null) {
            if (currentTime > req.session.otp.expire) {
                console.log("expire", req.session.otp.expire);
                const newDigit = otpGenerator.generate(6, {
                    digits: true,
                    alphabets: false,
                    specialChars: false,
                    upperCaseAlphabets: false,
                    lowerCaseAlphabets: false
                });
                req.session.otp.code = newDigit;
                const newExpiry = currentTime + 30

                req.session.otp.expire = newExpiry
                sendVerifyMail(req.session.name, req.session.email, req.session.otp.code);
                res.render("otp-verification", { message: `New OTP send to ${req.session.email}` });
            } else {
                res.render("otp-verification", { message: `OTP send to ${req.session.email}, resend after 30 second` });
            }
        }
        else {
            res.send("Already registered")
        }
    }
    catch (error) {
        console.log(error.message);
    }
}




const loadSignup = async (req, res) => {
    try {
        res.render('signup')
    } catch (error) {
        console.log(error);
    }
}

const insertUser = async (req, res) => {
    try {
        const otpDigit = otpGenerator.generate(6, {
            digits: true,
            alphabets: false,
            specialChars: false,
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false
        });

        const creationTime = Date.now() / 1000;
        const expirationTime = creationTime + 30;



        const userCheck = await User.findOne({ email: req.body.email })
        if (userCheck) {
            res.send("user already exist");
        }
        else {
            const spassword = await securePassword(req.body.password);
            req.session.name = req.body.name;
            req.session.email = req.body.email;
            req.session.mobile = req.body.mobile
            if (req.body.name && req.body.email) {
                if (req.body.password === req.body.confirmpassword) {
                    req.session.password = spassword;
                    req.session.otp = {
                        code: otpDigit,
                        expire: expirationTime
                    }
                    sendVerifyMail(req.session.name, req.session.email, req.session.otp.code);

                    res.render("otp-verification");
                } else {
                    res.render("signup", { message: "Password doesn't match" })
                }
            }
            else {
                res.render("signup", { message: "Please enter all details" })
            }

        }
    }
    catch (error) {
        console.log(error);
    }
}


const loadLogin = async (req, res) => {
    try {
        res.render('login')
    } catch (error) {
        console.log(error.message);
    }
}
// load  otp page

const showverifyOTPPage = async (req, res) => {
    try {
        res.render('otp-verification');
    } catch (error) {
        console.log(error);
    }
}

// post otp
const verifyOTP = async (req, res) => {

    try {
        const currentTime = Date.now() / 1000
        if (req.body.otp === req.session.otp.code && currentTime <= req.session.otp.expire) {

            const user = await User({
                name: req.session.name,
                email: req.session.email,
                mobile: req.session.mobile,
                password: req.session.password,
                isverified: 1,
                isListed: 1
            });
            const result = await user.save();
            res.redirect("/login")
        }
        else {
            res.render("otp-verification", { message: "Invalid OTP" });
        }
    } catch (error) {
        console.log(error);
    }
}





const loginVerify = async (req, res) => {
    try {
        const email = req.body.email
        const password = req.body.password
        const userData = await User.findOne({ email: email })

        if (userData) {

            if (userData.isListed == true) {
                const passwordMatch = await bcrypt.compare(password, userData.password)

                if (passwordMatch) {

                    if (userData.isverified === false) {
                        res.render('login', { message: "please verify your email" })
                    } else {
                        req.session.User = userData
                        req.session.user = userData.name

                        res.redirect('/')
                    }

                } else {

                    res.render('login', { message: "password is incorrect" })
                }
            } else {
                res.render('login', { message: 'incorrect details' })
            }
        } else {

            res.render('login', { message: "incorrect your email address" })
        }

    } catch (error) {
        console.log(error.message);
    }
}
const loadHome = async (req, res) => {

    try {
        if (req.session.user) {
            res.render('home', { user: req.session.user })
        } else {
            res.render('home', { message: "user logged" })
        }


    } catch (error) {

    }
}
const logOut = async (req, res) => {
    try {
        req.session.destroy()
        res.redirect('/')
    } catch (error) {
        console.log(error);
    }
}

// forgot password

const forgotLoad = async (req, res) => {
    try {
        res.render('forgot')
    } catch (error) {
        console.log(error);
    }
}

const forgotPassword = async (req, res) => {
    try {
        const email = req.body.email
        const userData = await User.findOne({ email: email })
        if (userData) {

            if (userData.isverified === 0) {
                res.render('forgot', { message: "Please verify your email" })
            } else {
                const randomString = randomstring.generate()
                const updatedData = await User.updateOne({ email: email }, { $set: { token: randomString } })
                sendResetPasswordMail(userData.name, userData.email, randomString)
                res.render('forgot', { message: "Please check your mail to reset your password" })
            }
        } else {
            res.render('forgot', { message: "Please enter correct email" })
        }
    } catch (error) {
        console.log(error);
    }
}
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
        console.log(error);
    }
}

const resetPassword = async (req, res) => {
    try {
        const password = req.body.password
        const user_id = req.body.user_id
        const spassword = await securePassword(password)
        const updatedData = await User.findByIdAndUpdate({ _id: user_id }, { $set: { password: spassword, token: '' } })

        res.redirect('/login')
    } catch (error) {
        console.log(error);
    }
}
// load user profile

const viewProfile = async (req, res) => {
    try {

        const name = req.session.user
        const user = await User.findOne({ name: name })

        res.render('profile', { user: req.session.user })

    } catch (error) {
        console.log(error);
    }
}

const loadContact = async (req, res) => {
    try {
        const user = req.session.User
        res.render('contact', { user: user })
    } catch (error) {
        console.log(error);
    }
}
// addto cart
// const addToCart=async (req,res)=>{
//     try {
//         if(req.session.user){
//             const productId = req.body.id

//         const name=req.session.user
//         const userData=await User.findOne({name:name})
//         const userId=userData._id
//         const productData=await Product.findById(productId)

//         const userCart=await Cart.findOne({user:userId})

//         if(userCart){
//             await Cart.updateOne({user:userId},{
//                 $push:{user:userId,"product.productId":productId}
//             })
//         }else{
//             const data=new Cart({
//                 user:userId,
//                 products:[{productId:productId}]
//             })
//             const result=await data.save()
//             // res.redirect('/add-to-cart')
//         }
//     }else{
//         res.json({login : true})
//     }

//     } catch (error) {
//         console.log(error);
//     }
// }
const addToCart = async (req, res) => {
    try {
        if (req.session.user) {
            const productId = req.body.id;
            const name = req.session.user;
            const userData = await User.findOne({ name: name });
            const userId = userData._id;
            const productData = await Product.findById(productId);

            const userCart = await Cart.findOne({ user: userId });

            if (userCart) {
                const proExist = await userCart.products.findIndex(product => product.productId == productId)

                console.log(proExist);

                if (proExist != -1) {
                    const cartData = await Cart.findOne({ user: userId, "products.productId": productId },
                        { "products.productId.$": 1, "products.quantity": 1 })

                    const [{ quantity: quantity }] = cartData.products

                    if (productData.stock <= quantity) {
                        res.json({ outofstock: true })
                    } else {
                        await Cart.findOneAndUpdate({ user: userId, "products.productId": productId },
                            { $inc: { "products.$.quantity": 1 } })
                    }

                } else {
                    await Cart.findOneAndUpdate({ user: userId }, { $push: { products: { productId: productId, price: productData.price } } });
                }


            } else {
                const data = new Cart({
                    user: userId,
                    products: [{ productId: productId, price: productData.price }]
                });
                const result = await data.save();
            }
            res.json({ success: true });
        } else {
            res.json({ loginRequired: true });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'An error occurred' });
    }
};

const getCartProducts = async (req, res) => {
    try {
        const name = req.session.user;
        const userData = await User.findOne({ name: name });
        const userId = userData._id;
        const cartData = await Cart.findOne({ user: userId }).populate("products.productId");
        if (req.session.user) {
            if (cartData) {

                if (cartData.products != 0) {
                    let Total
                    const total = await Cart.aggregate([
                        {
                            $match: { user: new ObjectId(userId) }
                        },
                        {
                            $unwind: '$products'
                        },
                        {
                            $project: {
                                quantity: "$products.quantity",
                                price: "$products.price"
                            }
                        },
                        {
                            $group:{
                                _id:null,
                                total:{
                                    $sum:{
                                        $multiply:["$quantity","$price"]
                                    }
                                }
                            }
                        }
                    ])
                    Total=total[0].total
                    
                    res.render('view-cart', { user: req.session.user,userId:userId,cart: cartData.products,total:Total });
                } else {
                    res.render('view-cart',{user:req.session.user,message:"hy"})
                }



               
            } else {
                res.render('view-cart', { user: req.session.user, message: "hy" })
            }
        } else {

        }
    } catch (error) {
        console.log(error);
    }
}
const cartQuantity =async (req,res)=>{
    try {
       
        console.log('api');
        let number=parseInt(req.body.count)
       const proId=req.body.product
       const userId=req.body.user
       const count= number

       
       console.log(count);
      
       const cartData = await Cart.findOne({ user: new ObjectId(userId), "products.productId": new ObjectId(proId)},
                        { "products.productId.$": 1, "products.quantity": 1 })
       console.log("cartdata  :",cartData);

       const [{quantity:quantity}]=cartData.products
       stockAvailable=await Product.find({_id:new ObjectId(proId)})

       if(stockAvailable.stock < quantity+count){
        res.json({success:false})
       }else{
        const datat=await Cart.updateOne({user:userId,"products.productId":proId},
        {
            $inc:{"products.$.quantity": count}
        })
        res.json({changeSuccess:true})
       }

    } catch (error) {
        console.log(error);
    }
}

const removeProduct=async (req,res)=>{
    try {
        console.log('apicall');
          const proId=req.body.product
            console.log("productiddd ",proId);
          const user=req.session.user
          const userId=user._id

             const cartData=await Cart.findOneAndUpdate({"products.productId":proId},
                {
                    $pull:{products:{productId:proId}}
                }
             )
             res.json({success:true})

    } catch (error) {
        console.log(error);
    }
}

module.exports = {
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
    addToCart,
    getCartProducts,
    cartQuantity,
    removeProduct
}