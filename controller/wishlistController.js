const { query } = require("express");
const Wishlist=require('../model/wishlistModel')
const User=require('../model/userModel')
const Product=require('../model/productModel')
const mongoose=require('mongoose');
const { tryCatch } = require("engine/utils");
const ObjectId = mongoose.Types.ObjectId;

const loadWishlist=async (req,res)=>{
    try {
      const name=req.session.user
      const userData=await User.findOne({name:name})
      const userId=userData._id
      const wishlist = await Wishlist.find({ userId }).populate('products');
 console.log('wishlist',wishlist);
        res.render('wishlist',{user:req.session.user,data:wishlist})
    } catch (error) {
        console.log(error);
    }
}

const addWishlist = async (req, res) => {
  try {
    const productId = req.body.productId;
    const name = req.session.user;
    
    const userData = await User.findOne({ name: name });
    const userId = userData._id;
    
    const userWishlist = await Wishlist.findOne({ userId });

    if (userWishlist) {
        // Check if the product is already in the wishlist
        if (userWishlist.products.some(product => product.equals(productId))) {
            return res.json({ already: true, message: 'Product is already in the wishlist' });
        } else {
            // If not, add the new product to the wishlist
            userWishlist.products.push(new mongoose.Types.ObjectId(productId));
            await userWishlist.save();
            return res.json({ success: true });
        }
    } else {
        // If the user doesn't have a wishlist, create a new wishlist
        const newWishlist = new Wishlist({
            userId,
            products: [new mongoose.Types.ObjectId(productId)],
        });

        await newWishlist.save();
        return res.json({ success: true });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const removeWishlist=async (req,res)=>{
  try {
    const productId=req.body.productId
   const name=req.session.user
   const userData=await User.findOne({name:name})
   const userId=userData._id
   
      
        console.log(productId)
        // Find the user's wishlist and remove the product
        const userWishlist = await Wishlist.findOne({ userId });

        if (userWishlist) {
            const productIndex = userWishlist.products.indexOf(productId);

            if (productIndex !== -1) {
                // Remove the product from the array
                userWishlist.products.splice(productIndex, 1);
                await userWishlist.save();
                return res.json({ success: true, message: 'Product removed from the wishlist successfully' });
            }
        }

        return res.json({ success: false, message: 'Product not found in the wishlist' });
  } catch (error) {
    console.log(error);
  }
}



module.exports={
    loadWishlist,
    addWishlist,
    removeWishlist
}