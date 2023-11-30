const User=require('../model/userModel')
const Address=require('../model/addressModel')
const mongoose=require('mongoose')
const Cart=require('../model/cartModel')
const {ObjectId}=require('mongodb')
const Order=require('../model/orderModel')
const userAuth=require('../middlewares/userAuth')
const Product=require('../model/productModel')
const path = require('path')
const fs=require('fs')
const puppeteer = require('puppeteer')
const ejs = require('ejs')
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
    res.render('500')
  }
}

const placeOrder=async (req,res)=>{
  try {

   
     const name=req.session.user
     const address=req.body.address
     const price=req.body.price
     const userData=await User.findOne({name:name})
     const userId=userData._id
     const cartData=await Cart.findOne({user:userId})
     const wallatBalance=userData.wallet
     const total=parseInt(req.session.Amount)||req.body.Total 
     const paymentMethods=req.body.payment
     const uniNum = Math.floor(Math.random() * 900000) + 100000;
     const code = req.body.code;
     const couponData = await Coupon.findOne({ couponCode: code });
   
        // ======
        const productIDs = cartData.products.map((productItem) => productItem.productId);

const productPrices = []; // Array to store product prices

const productData = await Cart.find({ "products.productId": { $in: productIDs } })
  .populate({
    path: "products.productId",
    select: "price discountedAmount",
  })
  .exec();

if (productData && productData.length > 0) {
  productData.forEach((order) => {
    if (order.products && order.products.length > 0) {
      order.products.forEach((product) => {
        const price = product.productId.discountedAmount || product.productId.price;
        productPrices.push(price); // Store the price in the array
        console.log(price);
      });
    } else {
      console.log("Products array is empty in the order");
    }
  });
} else {
  console.log("No matching orders found");
}

console.log(productPrices);
        // =======


     if(couponData){
     if(couponData.status==false){
      res.json({couponBlock:true})
     }
    }

    for (const item of cartData.products) {
      const productId =item.productId
      const product = await Product.findById(productId);
      if (!product || item.quantity > product.stock) {
        res.json({quantity:true})
        return
      }
    }
   
 let cartProducts
       if(paymentMethods=='online'){
         cartProducts=cartData.products.map((item,index)=>({
          productId:item.productId,
          quantity:item.quantity,
          price: productPrices[index],
          orderStatus:"NOT",
          statusLevel:1,
          paymentStatus:"pending",
          "returnOrderStatus.status":"none",
          "returnOrderStatus.reason":"none"
         }))
       }else{
         cartProducts=cartData.products.map((item,index)=>({
          productId:item.productId,
          quantity:item.quantity,
          orderStatus:"Placed",
          price:productPrices[index],
          statusLevel:1,
          paymentStatus:"pending",
          "returnOrderStatus.status":"none",
          "returnOrderStatus.reason":"none"
         }))
       }
     const today=new Date()

     const deliveryDate = new Date(today);
      deliveryDate.setDate(today.getDate() + 7);

     const order=new Order({
      user:userId,
        deliveryDetails:address,
        price:price,
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
     if(paymentMethods=='online') {
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
    res.render('500')
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
    res.render('500')
  }
}

const orderSuccess=async (req,res)=>{
  try {
    res.render('order-placed',{user:req.session.user})
  } catch (error) {
    console.log(error);
    res.render('500')
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
    
    const cancelreason=req.body.reason
    const refund=req.body.refund
    const total=req.body.totalprice


    const order=await Order.findOne({_id:orderId})
    
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
      const price=productInfo.price
      const minusAmount=quantity*price

    const totalInc=await Order.updateOne({_id:orderId},
      {$inc:
         {totalAmount:-minusAmount}
      })
      

      const updateQuantity=await Product.findByIdAndUpdate({_id:productId},
       {$inc:{stock:quantity}})

       res.redirect("/order-details");
  }else if(order.paymentMethod=='COD'){
      const productInfo= order.products.find(
      (product)=>product.productId===proId )
       productInfo.orderStatus = "Cancelled";
       productInfo.paymentStatus="Refunded"
       productInfo.cancelReason = cancelreason
      productInfo.updatedAt = Date.now()
       const result = await order.save();
       const quantity=productInfo.quantity
         const productId=productInfo.productId


         const price=productInfo.price
      const minusAmount=quantity*price

    const totalInc=await Order.updateOne({_id:orderId},
      {$inc:
         {totalAmount:-minusAmount}
      })
       
         const updateQuantity=await Product.findByIdAndUpdate({_id:productId},
        {$inc:{stock:quantity}})

        
          res.redirect("/order-details");     
  }
  } catch (error) {
    console.log(error);
    res.render('500')
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
    
    res.render('all-orders',{
      user:req.session.user,
      orders:orderData
    })  
  } catch (error) {
    console.log(error);
    res.render('500')
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
    res.render('500')
  }
}

const returnOrder=async(req,res)=>{
  try {
    const name=req.session.user
    const userData=await User.findOne({name:name})
    const userId=userData._id
   
    const proId=req.query.productId
    const orderId=req.query.orderId
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
    res.render('500')
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
    res.render('500')
  }
}

const invoiceDownload=async (req,res)=>{
  try {
    const id=req.params.id
    const name=req.session.user
    const userData= await User.findOne({name:name})
    const orderData=await Order.findOne({_id:id}).populate('products.productId')
    const userId=userData._id
    console.log('userdat',userData);
    console.log('ordrdata',orderData);
    console.log('userId',userId);
    const date= new Date()

    data={
      order:orderData,
      user:userData,
      date
    }

    const filepathName = path.resolve(__dirname, "../view/users/invoice.ejs");

    const html = fs.readFileSync(filepathName).toString();
    const ejsData = ejs.render(html, data);

    const browser = await puppeteer.launch({ headless: "new"});
    const page = await browser.newPage();
    await page.setContent(ejsData, { waitUntil: "networkidle0"});
    const pdfBytes = await page.pdf({ format: "letter" });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename= order invoice.pdf"
    );
    res.send(pdfBytes);


  } catch (error) {
    console.log(error);
    res.render('500')
  }
}

module.exports={
  
  orderSuccess,
    placeOrder,
    invoiceDownload,
    cancelOrder,
    allOrders,
    loadOrderDetails,
    verifyPayment,
    returnOrder,
    checkoutAddress
}