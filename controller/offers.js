const Product=require('../model/productModel')
const loadOffers=async (req,res)=>{
    try {


        const nonOffer=await Product.find({blocked:false})
          res.render('offers')
    } catch (error) {
        console.log(error);
    }
}

const loadProductOffers=async (req,res)=>{
    try {
        const nonOffer=await Product.find({blocked:false})
        const offer=await Product.find({blocked:false,discount:{$gt:0}})
        console.log('offffff',offer);
        res.render('product-offers',{nonOffer:nonOffer,offer:offer})
    } catch (error) {
        console.log(error);
    }
}
function calculateDiscountedPrice(originalPrice, discountPercentage) {
    const discountAmount = (discountPercentage / 100) * originalPrice;
    return originalPrice - discountAmount;
}

const addProductOffer=async(req,res)=>{
    try {
        const productId = req.body.productId;
        const discountAmount = req.body.discount;
        
        const product = await Product.findById(productId);
        const originalPrice = product.price;
        const discountedAmount = calculateDiscountedPrice(originalPrice, discountAmount);
        product.discountedAmount = discountedAmount;
        
        product.discount = discountAmount;
        await product.save();

       
       res.redirect('/admin/product-offers')
    } catch (error) {
        console.log(error);
    }
}
const removeOffer=async (req,res)=>{
    try {
        console.log('jkncjkjwcnjcwn',req.body.productId);
        const productId=req.body.productId
        const product=await Product.findByIdAndUpdate({_id:productId},
            {
                $set:{discount:0,discountedAmount:0}
            })
            res.json({success:true})

    } catch (error) {
        console.log(error);
    }
}

module.exports={
    loadOffers,
    loadProductOffers,
    addProductOffer,
    removeOffer
    
    
}