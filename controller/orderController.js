const User=require('../model/userModel')
const Address=require('../model/addressModel')
const Cart=require('../model/cartModel')
const {ObjectId}=require('mongodb')
const Order=require('../model/orderModel')
const userAuth=require('../middlewares/userAuth')

const postCheckout=async (req,res)=>{
    try {
console.log('api call');
        const name=req.session.user
        const userData=await User.findOne({name:name})
        const userId=userData._id

        const alladdress=await Address.findOne({user:userId})
    
        if (alladdress) {
            const selectedAddress = alladdress.address.find((address) => {
              return address._id.toString()=== req.body.address.toString()
            });
      
            console.log(selectedAddress);
      
            
      
            if (selectedAddress) {
              
              let Total
                const total = await Cart.aggregate([
                    {
                        $match :{user : new ObjectId(userId)}
                    },
                    {
                        $unwind : '$products'
                    },
                    {
                        $project :{
                            price :  '$products.price',
                            quantity : '$products.quantity'
                        }
                    },
                    {
                        $group :{
                            _id : null,
                            total : {
                                $sum : {
                                    $multiply : ["$quantity","$price"],
                                }
                            }
                        }
                    }
                ]).exec()
                Total = total[0].total
                console.log(Total);
              return res.render("orderpage", {
                user: userId,
                address: selectedAddress,
                total:Total,
              });
            } 
          } 
    } catch (error) {
        console.log(error);
    }
}


const itemsAndDelivery = async(req,res)=>{

    console.log("itemsAndDelivery");
  try{


    const addressId = req.body.id
    const name = req.session.user
    const userData=await User.findOne({name:name})
    const userId=userData._id
    console.log('addressid   ',addressId);
    let payment =
    req.body['payment-method'] === 'COD' ? "Cash On Delivery" : "Other Payment Method";

      console.log("payment Method is :",payment);

      const userAddress = await Address.findOne({user:userId})
    //   const userId=userAddress._id
      const selectedAddress = userAddress.address.find((address) => {
        return address && address._id ? address._id.toString() : null;
    });
      console.log("selected Address:", selectedAddress)

    //   const cartDetails = await Cart.find({user:userId}).exec()
      const cartDetails = await Cart.findOne({ user: userId }).populate("products.productId");

      console.log("cartDetails items and delivery : ", cartDetails);

      if (cartDetails) {
        let Total
        const total = await Cart.aggregate([
          {
              $match :{user : new ObjectId(userId)}
          },
          {
              $unwind : '$products'
          },
          {
              $project :{
                  price :  '$products.price',
                  quantity : '$products.quantity'

              }
          },
          {
              $group :{
                  _id : null,
                  total : {
                      $sum : {
                          $multiply : ["$quantity","$price"],
                      }
                  }
              }
          }
      ]).exec()
      Total = total[0].total
        // let deliveryDate = await daliveryDateCalculate();
        // console.log(deliveryDate);
        res.render("order-details", {
          total:Total,
          address: selectedAddress,
          user: userId,
          payment,
          cart: cartDetails.products,
          // deliveryDate,
        });
      }
    } catch (error) {
      console.log(error.message);
    }
}
const placeOrder=async (req,res)=>{
  try {
    
     const address=req.body.id
     console.log('addresssssssssss',address);
     const payment=req.body.payment
     const totalAmount=req.body.total
     const name=req.session.user
     const amount=req.body.price

     const userData=await User.findOne({name:name})
     const cartData=await Cart.findOne({user:userData._id})
     const product=cartData.products
     const newOrder=new Order({
      deliveryDetails:address,
      user:userData._id,
      paymentMethod:payment,
      product:product,
      totalAmount:totalAmount,
      Date:new Date(),
      
      amount:req.body.price

     })
     await newOrder.save()
     res.render('order-placed',{user:req.session.user})

  } catch (error) {
    console.log(error);
  }
}

module.exports={
    postCheckout,
    itemsAndDelivery,
    placeOrder
}