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
    console.log('hhhh');
     const address=req.body.address
     
     
     const payment=req.body.payment
     const totalAmount=req.body.total
     const name=req.session.user
     const amount=req.body.amount

     const userData=await User.findOne({name:name})
     const cartData=await Cart.findOne({user:userData._id})
     const product=cartData.products
    


     const status = payment === "COD" ? "Placed" : "Pending"


     const newOrder=new Order({
      deliveryDetails:address,
      user:userData._id,
      paymentMethod:payment,
      product:product,
      totalAmount:totalAmount,
      Date:new Date(),
      
      amount:amount

     })
     await newOrder.save()
     
      
     if(status=='Placed'){
      for(let i=0;i<product.length;i++){
        const productId = product[i].productId
        const quantity = product[i].quantity
        await Product.findByIdAndUpdate(productId,{$inc : {stock:-quantity}})
      }
      res.json({ codSuccess: true });
     
     }else {
       console.log('error');
     }
        

   

  } catch (error) {
    console.log(error);
  }
}



module.exports={
  
  
    placeOrder
}