const User=require('../model/userModel')
const Address=require('../model/addressModel')
const Cart=require('../model/cartModel')
const {ObjectId}=require('mongodb')
const Order=require('../model/orderModel')
const userAuth=require('../middlewares/userAuth')
const Product=require('../model/productModel')

// const postCheckout=async (req,res)=>{
//     try {
// console.log('api call');
//         const name=req.session.user
//         const userData=await User.findOne({name:name})
//         const userId=userData._id

//         const alladdress=await Address.findOne({user:userId})
    
//         if (alladdress) {
//             const selectedAddress = alladdress.address.find((address) => {
//               return address._id.toString()=== req.body.address.toString()
//             });
      
           
      
            
      
//             if (selectedAddress) {
              
//               let Total
//                 const total = await Cart.aggregate([
//                     {
//                         $match :{user : new ObjectId(userId)}
//                     },
//                     {
//                         $unwind : '$products'
//                     },
//                     {
//                         $project :{
//                             price :  '$products.price',
//                             quantity : '$products.quantity'
//                         }
//                     },
//                     {
//                         $group :{
//                             _id : null,
//                             total : {
//                                 $sum : {
//                                     $multiply : ["$quantity","$price"],
//                                 }
//                             }
//                         }
//                     }
//                 ]).exec()
//                 Total = total[0].total
               
//               return res.render("orderpage", {
//                 user: userId,
//                 address: selectedAddress,
//                 total:Total,
//               });
//             } 
//           } 
//     } catch (error) {
//         console.log(error);
//     }
// }


// const itemsAndDelivery = async(req,res)=>{

//     console.log("itemsAndDelivery");
//   try{


//     const addressId = req.body.id
//     const name = req.session.user
//     const userData=await User.findOne({name:name})
//     const userId=userData._id
    
//     let payment =
//     req.body['payment-method'] === 'COD' ? "Cash On Delivery" : "Other Payment Method";

      

//       const userAddress = await Address.findOne({user:userId})
//     //   const userId=userAddress._id
//       const selectedAddress = userAddress.address.find((address) => {
//         return address && address._id ? address._id.toString() : null;
//     });
      

//     //   const cartDetails = await Cart.find({user:userId}).exec()
//       const cartDetails = await Cart.findOne({ user: userId }).populate("products.productId");

      

//       if (cartDetails) {
//         let Total
//         const total = await Cart.aggregate([
//           {
//               $match :{user : new ObjectId(userId)}
//           },
//           {
//               $unwind : '$products'
//           },
//           {
//               $project :{
//                   price :  '$products.price',
//                   quantity : '$products.quantity'

//               }
//           },
//           {
//               $group :{
//                   _id : null,
//                   total : {
//                       $sum : {
//                           $multiply : ["$quantity","$price"],
//                       }
//                   }
//               }
//           }
//       ]).exec()
//       Total = total[0].total
//         // let deliveryDate = await daliveryDateCalculate();
//         // console.log(deliveryDate);
//         res.render("order-details", {
//           total:Total,
//           address: selectedAddress,
//           user: userId,
//           payment,
//           cart: cartDetails.products,
//           // deliveryDate,
//         });
//       }
//     } catch (error) {
//       console.log(error.message);
//     }
// }
const placeOrder=async (req,res)=>{
  try {
    console.log('place order');
    console.log(req.body);

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
     console.log(req.body.address);
     console.log(total);

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
      res.json({ codSuccess: true });
     
     }else {
       console.log('not added');
     }
        

   

  } catch (error) {
    console.log(error);
  }
}



module.exports={
  
  
    placeOrder
}