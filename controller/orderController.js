const User=require('../model/userModel')
const Address=require('../model/addressModel')
const Cart=require('../model/cartModel')
const {ObjectId}=require('mongodb')
const Order=require('../model/orderModel')
const userAuth=require('../middlewares/userAuth')
const Product=require('../model/productModel')


const placeOrder=async (req,res)=>{
  try {
   
     const name=req.session.user
     const address=req.body.address
   
     const userData=await User.findOne({name:name})
     const userId=userData._id
     const cartData=await Cart.findOne({user:userId})
     const products=cartData.products
     const total=parseInt(req.body.Total)
     const paymentMethods=req.body.payment
     const uniNum = Math.floor(Math.random() * 900000) + 100000;
     const status=paymentMethods=== 'COD'?'placed':'pending'

     const order=new Order({
        deliveryDetails:address,
        uniqueId:uniNum,
        userId:userId,
        userName:name,
        paymentMethod:paymentMethods,
        products:products,
        totalAmount:total,
        date:new Date(),
        status:status,
     })
    

   
    const orderdata= await order.save()
    const orderid=order._id
     
      
     if(status=='placed'){
      for(let i=0;i<products.length;i++){
        const productId = products[i].productId
        const quantity = products[i].quantity
        await Product.findByIdAndUpdate(productId,{$inc : {stock:-quantity}})
      }
      await Cart.deleteOne({user:userId})
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

const loadDetails=async (req,res)=>{
  try {
    
    const order_id = req.query._id
    const orderData = await Order.findOne({_id:order_id}).populate('products.productId')
    await orderData.populate('products.productId.category')
     


    res.render('order-details',{orders:orderData,user:req.session.user})
  } catch (error) {
    console.log(error);
  }
}

const cancelOrder=async (req,res)=>{
  try {
    const name=req.session.user
    const userData=await User.findOne({name:name})
    const userId=userData._id
    const orderId=req.body.orderid
    const cancelReason=req.body.reason
    const orderData=await Order.findByIdAndUpdate({_id:orderId},{$set:{status:'cancel',cancelReason:cancelReason}})
    
    for(let i=0;i<orderData.products.length;i++){
      let product=orderData.products[i].productId
      let quantity=orderData.products[i].quantity
      await Product.updateOne({_id:product},{$inc:{stock:quantity}})
    }

    res.redirect('/profile')

  } catch (error) {
    console.log(error);
  }
}


module.exports={
  
  orderSuccess,
    placeOrder,
    loadDetails,
    cancelOrder
}