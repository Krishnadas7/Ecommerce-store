const { log } = require("console");
const bcrypt = require('bcrypt')
const User = require('../model/userModel')
const nodemailer = require("nodemailer")
const otpGenerator = require("otp-generator");


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


const sendVerifyMail = async (name, email, otp)=> {
    try {
            const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: "skrishnadas38@gmail.com",
                pass: "fchb mtlq sjwa siiq"
            }
        });
        const mailoptions = {
            from:"skrishnadas38@gmail.com",
            to:email,
            subject:"Verification Mail",
            html : '<div style="text-align: center; background-color: Ivory; height: 200px;">' +
            '<h2 style="color:red;">Welcome to Branded</h2>' +
            '<h3>Hello, <b>'+ name + '</b>Thank you for joining us. Your OTP is : </h3>' +
            '<div style="vertical-align: center;"><h1 style="color: blue;">' + otp + '</h1></div>' +
            '</div>'       
        }

        transporter.sendMail(mailoptions, (error, info) => {
            if (error) {
                console.log(error)
            } else {
                console.log("Email has been send",info.response);
            }
        })
    } catch (error) {
        console.log("error",error.message);
    }
}




const loadSignup = async (req, res) => {
    try {
        res.render('signup')
    } catch (error) {
        console.log(error);
    }
}

const insertUser = async (req, res)=>{
    try{
        const otpDigit = otpGenerator.generate(6, { 
            digits: true,
            alphabets: false, 
            specialChars: false, 
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false 
        });

        const creationTime = Date.now()/1000;
        const expirationTime = creationTime + 30;

           

        const userCheck = await User.findOne({email: req.body.email})
        if(userCheck)
        {
            res.send("user already exist");
        }
        else{
            const spassword = await securePassword(req.body.password);
            req.session.name= req.body.name;
            req.session.email = req.body.email;
            req.session.mobile=req.body.mobile
            if(req.body.name && req.body.email){
                if (req.body.password === req.body.confirmpassword) {
                    req.session.password = spassword;
                    req.session.otp = {
                        code: otpDigit,
                        expire: expirationTime
                    }
                    sendVerifyMail(req.session.name, req.session.email, req.session.otp.code);
                    
                    res.render("otp-verification");
                } else {
                    res.render("signup",{message: "Password doesn't match"})
                }
            }
            else{
                res.render("signup",{message: "Please enter all details"})
            }
            
        }
    }
    catch(error){
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
const verifyOTP = async (req,res)=>{
    
    try {
        if(req.body.otp === req.session.otp.code){
            console.log(req.session.otp.code);
            console.log("verify otp");
            const user = await User({
                name: req.session.name,
                email: req.session.email,
                mobile: req.session.mobile,
                password: req.session.password,
                is_verified:1
            });
            const result = await user.save();
            res.redirect("/login")
        }
        else{
            res.render("otp-verification",{ message:"Invalid OTP" });
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
        console.log("userdata " + userData);
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password)
            if (passwordMatch) {
                console.log('password matched');
                res.redirect('/')
            } else {
                console.log('password is not matched');
                res.render('login', { message: "password is incorrect" })
            }
        } else {
            console.log('email is not matched');
            res.render('login', { message: "incorrect your email address" })
        }

    } catch (error) {
        console.log(error.message);
    }
}
const loadHome = async (req, res) => {

    try {
        res.render('home')
    } catch (error) {

    }
}


module.exports = {
    loadSignup,
    loadLogin,
    insertUser,
    loginVerify,
    loadHome,
    verifyOTP,
    showverifyOTPPage
}