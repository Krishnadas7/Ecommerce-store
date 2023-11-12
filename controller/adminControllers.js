const Admin=require('../model/adminModel')
const bcrypt=require('bcrypt')
const Order=require('../model/orderModel')
const Product=require('../model/productModel')
const User=require('../model/userModel')


    //    LOAD ADMIN LOGIN

    
const loadLogin=async (req,res)=>{
    try {
        
        res.render('admin-login')
    } catch (error) {
        console.log(error);
    }
}
            // ADMIN CHECKING


const loginVerify=async (req,res)=>{
    try {
         const email=req.body.email
         const password=req.body.password
         const adminData=await Admin.findOne({email:email})
         if(adminData){
            const passwordMatch=await bcrypt.compare(password,adminData.password)
            if(passwordMatch){
                req.session.Admin=true
                res.redirect('/admin/homepage')
            }else{
                res.render('admin-login',{message:"password was incorrect"})
            }
         }else{
            res.render('admin-login',{message:"email was incorrect"})
         }
         
          

    } catch (error) {
        console.log(error);
    }
}
         // LOAD ADMIN HOMEPAGE


const loadHomepage=(req,res)=>{
    try {
        res.render('admin-homepage')
    } catch (error) {
       console.log(error); 
    }
}
             // LOAD CATEGORY PAGE


const loadaddCategory=(req,res)=>{
    try {
        res.render('add-category')
    } catch (error) {
        console.log(error);
    }
}
             // LOAD ADMIN LOGOUT


const logOut=async (req,res)=>{
    try {
        req.session.Admin=false
        res.redirect('/admin')
    } catch (error) {
        console.log(error);
    }
}
//  =============================OEDER=============================================
const loadOrders=async (req,res)=>{
    try {
        
        const orders = await Order.find().populate("products.productId")

        const productWiseOrdersArray = [];
    
        for (const order of orders) {
          for (const productInfo of order.products) {
            const productId = productInfo.productId;
    
            const product = await Product.findById(productId).select(
              "name image price"
            );
            const userDetails = await User.findById(order.userId).select(
              "email"
            );
            // console.log(userDetails);
            if (product) {
              // Push the order details with product details into the array
              productWiseOrdersArray.push({
                user: userDetails,
                product: product,
                orderDetails: {
                  _id: order._id,
                  userId: order.userId,
                  deliveryDetails: order.deliveryDetails,
                  date: order.date,
                  totalAmount: productInfo.quantity * product.price,
                  orderStatus: productInfo.orderStatus,
                  statusLevel: productInfo.statusLevel,
                  paymentStatus:productInfo.paymentStatus,
                  paymentMethod: order.paymentMethod,
                  quantity: productInfo.quantity,
                },
              });
            }
          }
        }
        console.log('///',productWiseOrdersArray);
        res.render('view-orders',{orders:productWiseOrdersArray})
    } catch (error) {
        console.log(error);
    }
}

const orderDetails=async (req,res)=>{
    try {
        console.log('orderiddd ',req.query.id);
        const id=req.query.id

        const orderedProducts=await Order.findOne({_id:id}).populate('products.productId')
        console.log('////////////',orderedProducts);
        res.render('order-details',{orders:orderedProducts})
    } catch (error) {
        console.log(error);
    }
}

// to update order status
const updateOrder = async(req,res)=>{
    try {
  
      const order_id = req.body.orderId
      const orderStatus = req.body.status
      const user_id = req.session.user_id
      if(orderStatus == 'cancel'){
        const orderData = await Order.findOneAndUpdate({_id:order_id},{$set:{status:orderStatus,cancelReason:'There was a problem in youre order'}})
  
        for( let i=0;i<orderData.products.length;i++){
          let product = orderData.products[i].productId
          let quantity = orderData.products[i].quantity
          await Product.updateOne({_id:product},{$inc:{stock:quantity}})
        }
    
        // const data = {
        //   amount:orderData.totalAmount,
        //   date:new Date()
        // }
        // res.json({update:true})
        // const userData = await User.findOneAndUpdate({_id:user_id},{$inc:{wallet:orderData.totalAmount},$push:{walletHistory:data}})
      }else{
        const OrderData = await Order.findOneAndUpdate({_id:order_id},{$set:{status:orderStatus}})
      }
     
        res.json({update:true})  
  
    } catch (error) {
  
        console.log(error.message);
  
    }
  }

const orderManagement=async (req,res)=>{
try {

    const {orderId, productId}=req.query

    const order=await Order.findById(orderId)
    if (!order) {
        return res
          .status(404)
          .render('error-404');
      }
      const productInfo=order.products.find(
        (product)=>product.productId.toString()===productId
      )
      console.log('//',productInfo);
      const product = await Product.findById(productId).select(
        "name image price"
      )
    const productOrder={
        orderId:order._id,
        product: product,
        orderDetails: {
          _id: order._id,
          userId: order.userId,
          deliveryDetails: order.deliveryDetails,
          date: order.date,
          totalAmount:order.totalAmount,
          orderStatus: productInfo.orderStatus,
          statusLevel: productInfo.statusLevel,
          paymentStatus:productInfo.paymentStatus,
          paymentMethod: order.paymentMethod,
          quantity: productInfo.quantity,
    }
}


    res.render('order-management',{product:productOrder,orderId,productId})
} catch (error) {
    console.log(error);
}
}

const changeStatus=async (req,res)=>{
  try {
    const {status,orderId,productId}=req.body
     const order=await Order.findById(orderId)
     const productinfo=order.products.find(
      (product)=>product.productId===productId
     )
     console.log('ooo',order);
     console.log('ppp',productinfo);

     const statusMap = {
      Shipped: 2,
      outfordelivery: 3,
      Delivered: 4,
    };

    const selectedStatus = status;
    const statusLevel = statusMap[selectedStatus];
    productinfo.orderStatus=status
    productinfo.statusLevel=statusLevel
    productinfo.updatedAt = Date.now();
    const result=await order.save()
    res.redirect(
      `/admin/order-managment?orderId=${orderId}&productId=${productId}`
    );

     

  } catch (error) {
    console.log(error);
  }
}

const cancelOrderadmin=async (req,res)=>{
  try {
    const proId=req.body.productId
    const orderId=req.body.orderId
    console.log('llllll',req.body);
    const order=await Order.findOne({_id:orderId})
    const productInfo= order.products.find(
      (product)=>product.productId===proId
    )
    
    productInfo.orderStatus = "Cancelled";
    productInfo.updatedAt = Date.now()
    const result = await order.save();
    
  const quantity=productInfo.quantity
  const productId=productInfo.productId

  const updateQuantity=await Product.findByIdAndUpdate({_id:productId},
    {$inc:{stock:quantity}})
    res.json({cancel:true})

    // res.redirect('/profile')

  } catch (error) {
    console.log(error);
  }
}

module.exports={
    loadLogin,
    loginVerify,
    loadHomepage,
    loadaddCategory,
    logOut,
    loadOrders,
    orderDetails,
    orderManagement,
    changeStatus,
    cancelOrderadmin

}