const User=require('../model/userModel')
const Address=require('../model/addressModel')
const Cart=require('../model/cartModel')
const {ObjectId}=require('mongodb')
const Order=require('../model/orderModel')
const userAuth=require('../middlewares/userAuth')
const Product=require('../model/productModel')
const { render } = require('../routes/userRouter')

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
     
      
     if(paymentMethods=='COD'){
     for(const item of cartData.products){
      const productId = item.productId
      const quantity = item.quantity

      await Product.findByIdAndUpdate({_id:productId},{
        $inc:{stock:-quantity}
      })

     }
     await Cart.findOneAndDelete({userid:req.body.user_id})
      res.json({placed:true})
      

      // res.json({ codSuccess: true });
     
     }else {
       console.log('not added');
     }
        
    
   

  } catch (error) {
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
   console.log('llllll',req.body);
    const orderId=req.body.orderId
    
    const order=await Order.findOne({_id:orderId})
    console.log('///',order);

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
    
    // for(let i=0;i<orderData.products.length;i++){
    //   let product=orderData.products[i].productId
    //   let quantity=orderData.products[i].quantity
    //   await Product.updateOne({_id:product},{$inc:{stock:quantity}})
    // }
    res.json({cancel:true})

    // res.redirect('/profile')

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
    loadOrderDetails
}