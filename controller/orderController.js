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
     
     const total=parseInt(req.body.Total)
     const paymentMethods=req.body.payment
     const uniNum = Math.floor(Math.random() * 900000) + 100000;
     

     const cartProducts=cartData.products.map((item)=>({
      productId:item.productId,
      quantity:item.quantity,
      orderStatus:"Placed",
      statusLevel:1,
      paymentStatus:"pending",
      "returnOrderStatus.status":"none",
      "returnOrderStatus.reason":"none"
     }))
    //  const total=await calculateTotalPrice(userId)
     const today=new Date()

     const deliveryDate = new Date(today);
      deliveryDate.setDate(today.getDate() + 7);

     const order=new Order({
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
     
     for(const item of cartData.products){
      const productId = item.productId
      const quantity = item.quantity

      await Product.findByIdAndUpdate({_id:productId},{
        $inc:{stock:-quantity}
      })

     }
    
      res.json({success:true,orderid})
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
        { $set: {  "products.$[].paymentStatus":"Completed"} }
      );

      await Order.findByIdAndUpdate(
        { _id: details.order.receipt },
        { $set: { paymentId: details.payment.razorpay_payment_id } }
      );
    
      const orderid = details.order.receipt;

      
     
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
    const proId=req.body.productId
    const orderId=req.body.orderId
    
    const order=await Order.findOne({_id:orderId})
   console.log('body',req.body);

    const productInfo= order.products.find(
      (product)=>product.productId===proId
    )
    console.log('infooo',productInfo);
    productInfo.orderStatus = "Cancelled";
    productInfo.updatedAt = Date.now()
    const result = await order.save();
    
  const quantity=productInfo.quantity
  const productId=productInfo.productId

  const updateQuantity=await Product.findByIdAndUpdate({_id:productId},
    {$inc:{stock:quantity}})
    
    
    res.json({cancel:true})
  } catch (error) {
    console.log(error);
  }
}

const allOrders =async (req,res)=>{
  try {
    const name=req.session.user
    const userData=await User.findOne({name:name})
    const userId=userData._id
    const orderData=await Order.find({userId:userId})
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
    order =await Order.findOne({useerId:userId}).populate({path:'products.productId'}).sort({date:-1})
    }

   const products= await Cart.findOne({user:userId}).populate('products.productId')
   
    res.render('order-details',{
      user:req.session.user,
      products,
      order

    })
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
    verifyPayment
}