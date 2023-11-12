const Address=require('../model/addressModel')
const User=require('../model/userModel')
const { ObjectId } = require("mongodb")
const Cart=require('../model/cartModel')
const Products=require('../model/productModel')
const Category=require('../model/categoryModel')
const bcrypt=require('bcrypt')
const coupons=require('../model/couponModel')


const securePassword = async (password) => {
  try {
      const passwordHash = await bcrypt.hash(password, 10)
      return passwordHash
  } catch (error) {
      console.log(error);
  }
}


const  addAddress=async(req,res)=>{
    try {
        res.render('add-address',{user:req.session.user})
    } catch (error) {
        console.log(error);
    }
}

const insertAddress = async (req, res) => {
    try {
      const name = req.session.user
      const userData = await User.findOne({name:name});
      const userId=userData._id
  
      const addressData = await Address.findOne({ user:userId });
  
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
                pin: req.body.pin,
              },
            },
          }
        );
        res.redirect("/profile");
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
              pin: req.body.pin,
            },
          ],
        });
        await data.save();
        res.redirect("/profile");
      }
    } catch (error) {
      console.log(error);
    
    }
  };

  const editAddress=async (req,res)=>{
    try {
      console.log(';;;;;;;;;;;;;;;;;edittt');
        const addressId=req.query.id
        const name=req.session.user
        console.log('name ',name);
        const userData=await User.findOne({name:name})
        console.log('userdata',userData);
        const userId=userData._id
        console.log('useridd  ',userId);
        const address=await Address.findOne({user:new ObjectId(userId)},{address:{$elemMatch:{_id:new ObjectId(addressId)}}})
        console.log(address);

        const addres=address.address[0]
      res.render('edit-address',{user:req.session.user,address:addres})
    } catch (error) {
     console.log(error); 
    }
  }


  const updateAddress=async (req,res)=>{
    try {
         const name=req.session.user
         const userData=await User.findOne({name:name})
         const userId=userData._id
         const addressId=req.body.id
         console.log('name:',name);
         console.log('userdata:',userData);
         
          
         const details =await Address.updateOne({user: new ObjectId(userId),"address._id":addressId},{
          $set:{
            "address.$.name":req.body.name,
            "address.$.pin":req.body.pin,
            "address.$.city":req.body.city,
            "address.$.mobile":req.body.mobile,
            "address.$.state":req.body.state,
            "address.$.housename":req.body.housename,
            "address.$.email":req.body.email
          }
        
         })
         res.redirect('/profile')

    } catch (error) {
      console.log(error);
    }
  }

  const loadCheckout=async (req,res)=>{
    try {
    
    if(req.session.user){
        const name=req.session.user
        const userData=await User.findOne({name:name}) 
        const userId=userData._id  
        const addressData=await Address.findOne({user:new ObjectId(userId)})  
        const cartData=await Cart.findOne({user:userId}).populate('products.productId')
        console.log('addressdata',addressData);
        let address
        let Products
        if(cartData){
       Products=cartData.products
      }else{
        Products=[]
      }
        
        if(addressData){
          address=addressData.address
        }
        console.log(address);
                let totalPrice=0    
                    for(const product of cartData.products){
                      totalPrice+=product.quantity*product.productId.price
                    }            
      res.render('checkout',{user:req.session.user,
        address,
        product:Products,
        total:totalPrice})
    }else{
      res.render('checkout',{message:"user logged"})
    }     
        //  ,{user:req.session.user,total:Total,address:address.address,data : cartData.products}
    } catch (error) {
      console.log(error);
    }
  }

  const productFilter= async (req,res)=>{
    try {

      const perPage = 12;
      let page = parseInt(req.query.page) || 1;
      // const categoryDetails = await Category.find({});

      let search = ''; // Fix the variable name here

      if (req.query.search) {
          search = req.query.search; // Fix the variable name here
      }

      const totalProducts = await Products.countDocuments({ blocked: false });
      const totalPages = Math.ceil(totalProducts / perPage);

      if (page < 1) {
          page = 1;
      } else if (page > totalPages) {
          page = totalPages;
      }

      const products = await Products
          .find({
              blocked: false,
              name: { $regex: new RegExp(search, 'i') }
          })
          .skip((page - 1) * perPage)
          .limit(perPage);
          let splitPrice
          let minimum
          let maximum
      
          let price=req.body.price
          if(price){
             splitPrice=price.split('-')
             minimum=parseInt(splitPrice[0])
            maximum=parseInt(splitPrice[1])
          }
          
            
          
          
         
         const sort=parseInt(req.body.sort)
         const category=req.body.category
         
         const categoryData=await Category.find()
         const productData=await Products.find({price:{$gte:minimum,$lte:maximum},category:category}).sort({price:sort})
         res.render('all-product',{
          user:req.session.user,
          product:productData,
          category:categoryData,
          currentPage: page, 
          pages: totalPages
         })
    } catch (error) {
      console.log(error);
    }
  }

  // const resetPassword=async (req,res)=>{
  //   try {
  //     const currentpd=req.body.currentpassword
  //     const newpd=req.body.newpassword
  //     const confirmpd=req.body.confirmpassword
          
  //     const name=req.session.user
  //     const userData=await User.findOne({name:name})
  //     const userId=userData._id
  //     console.log(userData);
  //     const oldpd=userData.password
  //     console.log(oldpd);

  //       if(userData){
  //         const passwordMatch=await bcrypt.compare(currentpd,oldpd)
         
  //         if(passwordMatch){
  //             if(newpd===confirmpd){
  //                  const secure=await securePassword(newpd)
  //                  const store=await User.updateOne({_id:userId},{$set:{password:secure}})
  //                  console.log('all matched');
  //                  res.redirect('/profile')
  //             }else{
  //               console.log('new and confirm not matched');
  //               res.redirect('/profile')
  //             }
  //         }else{
  //           console.log('old and currnt is not matched');
  //           res.redirect('/profile')
  //         }
  //       }

  //   } catch (error) {
  //     console.log(error);
  //   }
  // }
  const resetPassword = async (req, res) => {
    try {
      // ... your existing server-side code ...
      const currentpd=req.body.currentpassword
      const newpd=req.body.newpassword
      const confirmpd=req.body.confirmpassword
          
      const name=req.session.user
      const userData=await User.findOne({name:name})
      const userId=userData._id
      console.log(userData);
      const oldpd=userData.password
      console.log(oldpd);
      if (userData) {
        const passwordMatch = await bcrypt.compare(currentpd, oldpd);
  
        if (passwordMatch) {
          if (newpd === confirmpd) {
            const secure = await securePassword(newpd);
            const store = await User.updateOne({ _id: userId }, { $set: { password: secure } });
  
            // Send success response
            res.json({ redirect: '/profile' });
          } else {
            // Send error response for new and confirm password mismatch
            res.json({ newpassworderror: 'New and confirm passwords do not match' });
          }
        } else {
          // Send error response for old and current password mismatch
          res.json({ currentpassworderror: 'Old and current passwords do not match' });
        }
      } else {
        // Send error response for user not found
        res.json({ currentpassworderror: 'User not found' });
      }
  
    } catch (error) {
      console.log(error);
      // Send a generic error response
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  

  const deleteAddress=async (req,res)=>{
    try {
      const id=req.body.id
      console.log('//////////////',id);
      const name=req.session.user
      const userData=await User.findOne({name:name})
      const userId=userData._id
      
      const deleteAddress=await Address.findOneAndUpdate({user:userId},{
        $pull:{address:{_id:id}}
      })

      res.json({delete:true})
    } catch (error) {
      console.log(error);
    }
  }

module.exports={
    addAddress,
    insertAddress,
    editAddress,
    updateAddress,
   loadCheckout,
   productFilter,
   resetPassword,
   deleteAddress

}