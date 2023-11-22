const User=require('../model/userModel')
const Address=require('../model/addressModel')
const Cart=require('../model/cartModel')
const {ObjectId}=require('mongodb')
const Order=require('../model/orderModel')
const userAuth=require('../middlewares/userAuth')
const Product=require('../model/productModel')
const { render } = require('../routes/userRouter')
const Razorpay=require('razorpay')
const crypto=require('crypto')
const Coupon=require('../model/couponModel')
// key_id,key_secret
// rzp_test_49DsJEEbScMJdv,oIo905FGjFAr6eEZfkNhmDEU

var instance = new Razorpay({ key_id: 'rzp_test_49DsJEEbScMJdv', key_secret: 'oIo905FGjFAr6eEZfkNhmDEU' })



const calculateTotalPrice=async (userId)=>{
  try {
      const cart=await Cart.findOne({user:userId}).populate('products.productId')
      if (!cart) {
        console.log("User does not have a cart.");
      }
      let totalPrice=0
      for(const cartProduct of cart.products){
        const {productId,quantity}=cartProduct
        const productSubtotal=productId.price*quantity
        totalPrice+=productSubtotal

      }
      return totalPrice
  } catch (error) {
    console.log(error);
  }
}

const placeOrder=async (req,res)=>{
  try {

   
     const name=req.session.user
     const address=req.body.address
   
     const userData=await User.findOne({name:name})
     const userId=userData._id
     const cartData=await Cart.findOne({user:userId})
     const wallatBalance=userData.wallet
     const total=parseInt(req.session.Amount)||req.body.Total
     
     const paymentMethods=req.body.payment
     const uniNum = Math.floor(Math.random() * 900000) + 100000;
     const code = req.body.code;
     //user limit decreasing
     console.log('code',code);
     console.log('body',req.body);
     const couponData = await Coupon.findOne({ couponCode: code });
     if(couponData){
     if(couponData.status==false){
      res.json({couponBlock:true})
     }
    }



    
  

   
 let cartProducts
       if(paymentMethods=='online'){
         cartProducts=cartData.products.map((item)=>({
          productId:item.productId,
          quantity:item.quantity,
          orderStatus:"NOT",
          statusLevel:1,
          paymentStatus:"pending",
          "returnOrderStatus.status":"none",
          "returnOrderStatus.reason":"none"
         }))
       }else{
         cartProducts=cartData.products.map((item)=>({
          productId:item.productId,
          quantity:item.quantity,
          orderStatus:"Placed",
          statusLevel:1,
          paymentStatus:"pending",
          "returnOrderStatus.status":"none",
          "returnOrderStatus.reason":"none"
         }))
       }
        
    
     
    //  const total=await calculateTotalPrice(userId)
     const today=new Date()

     const deliveryDate = new Date(today);
      deliveryDate.setDate(today.getDate() + 7);

     const order=new Order({
      user:userId,
        deliveryDetails:address,
        
        userId:userId,
        userName:name,
        
        products:cartProducts,
        totalAmount:total,
        paymentMethod:paymentMethods,
        expectedDelivery:deliveryDate,
        date:new Date(),
        trackId:uniNum
        
     })
    

   
    const orderdata= await order.save()
    const orderid=order._id
    
     if(orderdata){
      
     if(paymentMethods=='COD'){
      const minus= await Coupon.updateOne({couponCode:req.session.code},{$inc:{usersLimit: -1 }})
     
      const pushing= await Coupon.updateOne({couponCode:req.session.code},{$push:{usedUsers:userId}})
     for(const item of cartData.products){
      const productId = item.productId
      const quantity = item.quantity

      await Product.findByIdAndUpdate({_id:productId},{
        $inc:{stock:-quantity}
      })

     }
     await Cart.findOneAndDelete({user:userId})
      res.json({success:true,orderid})

      if(req.session.code){
        const coupon = await Coupon.findOne({couponCode:req.session.code});
        const disAmount = coupon.discountAmount;
        await Order.updateOne({_id:orderid},{$set:{discount:disAmount}});
        res.json({success:true,orderid})
      }
    }else{
      const orderId=orderdata._id
      const totalAmount=orderdata.totalAmount
    

      // res.json({ codSuccess: true });
     
     if(paymentMethods=='online') {
      
       console.log('not added');
       var options = {
        amount: total*100,  // amount in the smallest currency unit
        currency: "INR",
        receipt: ""+orderid
      };

      instance.orders.create(options, function(err, order) {
        console.log('///',order);
        res.json({order})
      });
     }
     if(paymentMethods=='wallet'){

      const minus= await Coupon.updateOne({couponCode:code},{$inc:{usersLimit: -1 }})
     
    const pushing= await Coupon.updateOne({couponCode:code},{$push:{usedUsers:userId}})
        if(wallatBalance >= total){
          console.log('///',wallatBalance >= total);
         const result= await User.findByIdAndUpdate({_id:userId},
            {$inc:{wallet:-total},
            $push:{
              walletHistory:{
                transactionDate:new Date(),
                transactionDetails:"Purchased amount debited",
                transactionType:"Debit",
                transactionAmount:total
              }
            }
          }
            )
            for (let i = 0; i < cartData.products.length; i++) {
              const productId = cartData.products[i].productId;
              const quantity = cartData.products[i].quantity;
              await Product.findByIdAndUpdate(
                { _id: productId },
                { $inc: { stock: -quantity } }
              );
            }
            await Cart.findOneAndDelete({user:userId})
      await Order.updateOne(
        { _id: orderId },
        { $set: {  "products.$[].paymentStatus":"Completed"} }
      );
      

       if(req.session.code){
              const coupon = await Coupon.findOne({couponCode:req.session.code});
              const disAmount = coupon.discountAmount;
              await Order.updateOne({_id:orderid},{$set:{discount:disAmount}});
              res.json({wallet:true})
       }
           
       res.json({wallet:true})
        }else{
          res.json({wallet:false})
        }
     }
     
    
        
    }
  }
   

  } catch (error) {
    console.log(error);
  }
}

const verifyPayment = async(req,res)=>{
  try{
    const name=req.session.user
    const userData= await User.findOne({name:name})
    const userId=userData._id
    
    const cartData = await Cart.findOne({user:userId})
    const products = cartData.products
    const details = req.body;
    const hmac = crypto.createHmac("sha256", "oIo905FGjFAr6eEZfkNhmDEU");

    hmac.update(
      details.payment.razorpay_order_id +
        "|" +
        details.payment.razorpay_payment_id
    );
    const hmacValue = hmac.digest("hex");

    if (hmacValue === details.payment.razorpay_signature) {
      console.log('details/////',details.payment.razorpay_signature);
      for (let i = 0; i < products.length; i++) {
        const productId = products[i].productId;
        const quantity = products[i].quantity;
        await Product.findByIdAndUpdate(
          { _id: productId },
          { $inc: { stock: -quantity } }
        );
      }
      await Cart.findOneAndDelete({user:userId})
      await Order.findByIdAndUpdate(
        { _id: details.order.receipt },
        { $set: {  "products.$[].paymentStatus":"Completed","products.$[].orderStatus":"Placed"} }
      );
      const minus= await Coupon.updateOne({couponCode:req.session.code},{$inc:{usersLimit: -1 }})
     
      const pushing= await Coupon.updateOne({couponCode:req.session.code},{$push:{usedUsers:userId}})
      await Order.findByIdAndUpdate(
        { _id: details.order.receipt },
        { $set: { paymentId: details.payment.razorpay_payment_id } }
      );
    
      const orderid = details.order.receipt;
      if(req.session.code){
        const coupon = await Coupon.findOne({couponCode:req.session.code});
        const disAmount = coupon.discountAmount;
        await Order.updateOne({_id:orderid},{$set:{discount:disAmount}});
        res.json({ codsuccess: true, orderid });
      }
      
     
      res.json({ codsuccess: true, orderid });

    }else {
      await Order.findByIdAndRemove({ _id: details.order.receipt });
      res.json({ success: false });
    }

  }catch(error){
    console.log(error);
  }
}

const orderSuccess=async (req,res)=>{
  try {
    res.render('order-placed',{user:req.session.user})
  } catch (error) {
    console.log(error);
  }
}

// const loadDetails=async (req,res)=>{
//   try {
    
//     const order_id = req.query._id
//     const orderData = await Order.findOne({_id:order_id}).populate('products.productId')
//     await orderData.populate('products.productId.category')
     


//     res.render('order-details',{orders:orderData,user:req.session.user})
//   } catch (error) {
//     console.log(error);
//   }
// }

const cancelOrder=async (req,res)=>{
  try {
    
    const name=req.session.user
    const userData=await User.findOne({name:name})
    const userId=userData._id
   
    const proId=req.query.productId
    const orderId=req.query.orderId
    console.log('ppppp',proId,orderId);
    const cancelreason=req.body.reason
    const refund=req.body.refund
    const total=req.body.totalprice

    const order=await Order.findOne({_id:orderId})
   console.log('body',total);
   if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if(order.paymentMethod!='COD'){
    const refundOption=""+refund
    const result=await User.findOneAndUpdate({_id:userId},
      {
        $inc:{wallet:total},
        $push:{
          walletHistory:{
            transactionDate:new Date(),
            transactionDetails:"Cancelled Amount credited",
            transactionType:"Credit",
            transactionAmount:total
          }
        }
      }
      )
if(result){
  console.log('amount ',total);
}else{
  console.log("user not found");
}
const productInfo= order.products.find(
       (product)=>product.productId===proId )
        productInfo.orderStatus = "Cancelled";
        productInfo.paymentStatus="Refunded"
        productInfo.cancelReason = cancelreason
       productInfo.updatedAt = Date.now()
       const data = await order.save();

         const quantity=productInfo.quantity
       const productId=productInfo.productId

      const updateQuantity=await Product.findByIdAndUpdate({_id:productId},
       {$inc:{stock:quantity}})

       res.redirect("/order-details");
  }else if(order.paymentMethod=='COD'){
      const productInfo= order.products.find(
      (product)=>product.productId===proId )
       productInfo.orderStatus = "Cancelled";
       productInfo.paymentStatus="Refunded"
      productInfo.updatedAt = Date.now()
       const result = await order.save();
       const quantity=productInfo.quantity
         const productId=productInfo.productId
       
         const updateQuantity=await Product.findByIdAndUpdate({_id:productId},
        {$inc:{stock:quantity}})
        
          res.redirect("/order-details");
        
  }




//  const productInfo= order.products.find(
//       (product)=>product.productId===proId )
//      productInfo.orderStatus = "Cancelled";
//     productInfo.updatedAt = Date.now()
//     const result = await order.save();
    
//   const quantity=productInfo.quantity
//   const productId=productInfo.productId

//   const updateQuantity=await Product.findByIdAndUpdate({_id:productId},
//     {$inc:{stock:quantity}})
//     if(order.paymentMethod!=='COD'){
       
//     }
    
    // res.json({cancel:true})
  } catch (error) {
    console.log(error);
  }
}

const allOrders =async (req,res)=>{
  try {
    const name=req.session.user
    const userData=await User.findOne({name:name})
    const userId=userData._id
    const orderData=await Order.find({userId:userId,"products.orderStatus": { $ne: "NOT" }}).populate('user').populate({
      path:'products.productId',
      model:'Product',
      select:'name'
    })
    console.log('///////////',orderData);
    res.render('all-orders',{
      user:req.session.user,
      orders:orderData
    })  
  } catch (error) {
    console.log(error);
  }
}
const loadOrderDetails=async (req,res)=>{
  try {
    const orderId=req.query.id
    const name=req.session.user
    const userData=await User.findOne({name:name})
    const userId=userData._id
    
    let order 
    if(orderId){
     order=await Order.findOne({_id:orderId}).populate({path:'products.productId'}).sort({date:-1})
    }else{
    order =await Order.findOne({userId:userId}).populate({path:'products.productId'}).sort({date:-1})
    }
    const currentDate = new Date();
    const deliveryDate = order.expectedDelivery;
    const timeDiff = currentDate - deliveryDate;
    const daysDiff = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
    console.log('diff',daysDiff);

   const products= await Cart.findOne({user:userId}).populate('products.productId')
   
    res.render('order-details',{
      user:req.session.user,
      products,
      order,
      daysDiff

    })
  } catch (error) {
    console.log(error);
  }
}

const returnOrder=async(req,res)=>{
  try {
    const name=req.session.user
    const userData=await User.findOne({name:name})
    const userId=userData._id
   
    const proId=req.query.productId
    const orderId=req.query.orderId
    console.log('ppppp',proId,orderId);
    const cancelreason=req.body.reason
    const refund=req.body.refund
    const total=req.body.totalprice
    const order=await Order.findOne({_id:orderId})

    const result=await User.findOneAndUpdate({_id:userId},
      {
        $inc:{wallet:total},
        $push:{
          walletHistory:{
            transactionDate:new Date(),
            transactionDetails:"Cancelled Amount credited",
            transactionType:"Credit",
            transactionAmount:total
          }
        }
      }
      )
    if (result) {
      const productInfo= order.products.find(
        (product)=>product.productId===proId )
         productInfo.orderStatus = "Returned";
        productInfo.updatedAt = Date.now()
         const result = await order.save();
         const quantity=productInfo.quantity
           const productId=productInfo.productId
         
           const updateQuantity=await Product.findByIdAndUpdate({_id:productId},
          {$inc:{stock:quantity}})
          
            res.redirect("/order-details");
    } else {
      console.log("user not found");
    }
  } catch (error) {
    console.log(error);
  }
}

const checkoutAddress=async (req,res)=>{
  try {
   
    const name = req.session.user
    const userData = await User.findOne({name:name});
    const userId=userData._id;
    console.log('mnjhchds',req.body);

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
     
     res.json({success:true})
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
      res.json({success:true})
    }


  } catch (error) {
    console.log(error);
  }
}

module.exports={
  
  orderSuccess,
    placeOrder,
    
    cancelOrder,
    allOrders,
    loadOrderDetails,
    verifyPayment,
    returnOrder,
    checkoutAddress
}