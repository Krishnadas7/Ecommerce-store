const Admin=require('../model/adminModel')
const bcrypt=require('bcrypt')
const Order=require('../model/orderModel')
const Product=require('../model/productModel')
const User=require('../model/userModel')
const dashboardHelper=require('../helpers/orderHelpers')
const reportController=require('../controller/reportController')






        // LOAD ADMIN HOMEPAGE


        const loadHomepage = async (req, res) => {
          try {
            let users = await User.find({});
            const TransactionHistory = await Order.find();
            const countOfCod = await Order.countDocuments({ paymentMethod: "COD" });
            const countOfOnline = await Order.countDocuments({ paymentMethod: "online" });
            const countOfWallet = await Order.countDocuments({ paymentMethod: "wallet" });
        
            const totalrevenue=await Order.aggregate([
              {$match:{'products.paymentStatus':'Completed'}},
              {$group:{_id:null,total:{$sum:'$totalAmount'}}}
            ])
            console.log('jhjghjghjhg',totalrevenue);
        
            const orders = await recentOrder();
            const result = await createSalesReport("year");
            console.log(result);
        
            if (result !== null) {
              const report = {
                totalSalesAmount: result.totalSalesAmount,
                sales: result.totalProductsSold,
                amount: result.profit,
              };
        
              res.render('admin-homepage', {
                users: users,
                paymentHistory: TransactionHistory,
                paymentChart: { countOfCod, countOfOnline, countOfWallet },
                orders,
                report,
                totalrevenue
                
              });
            } else {
              console.log("No sales data found for the specified interval.");
              res.render('admin-homepage', {
                users: users,
                orders,
                totalrevenue,
                paymentHistory: TransactionHistory,
                paymentChart: { countOfCod, countOfOnline, countOfWallet },
                
                report: { totalSalesAmount: 0, sales: 0, amount: 0 },
              });
            }
          } catch (error) {
            console.log(error);
            res.render('500')
          }
        };
        
    // const result = await createSalesReport("year")
    
    
    // const report = {
    //   totalSalesAmount:result.totalSalesAmount,
    //   sales: result.totalProductsSold,
    //   amount: result.profit,
    // };
            
    //       res.render('admin-homepage',{
    //         users: users,
    //   paymentHistory: TransactionHistory,
    //   paymentChart,

    //       }
          
    //       )

    //       } catch (error) {
    //          console.log(error); 
    //       }
    //   }


   
const createSalesReport = async (interval) => {
  try {
    let startDate, endDate;

    if (interval === "day") {
      const today = new Date();
      startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0); // Start of the day
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999); // End of the day
    } else {
      startDate = getStartDate(interval);
      endDate = getEndDate(interval);
    }


   
    const orderDataData = await Order.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $unwind: "$products",
      },
      {
        $lookup: {
          from: 'products',
          localField: 'products.productId',
          foreignField: '_id',
          as: 'populatedProduct',
        },
      },
      {
        $unwind: {
          path: '$populatedProduct',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          'populatedProduct.paymentStatus': 'Completed',
        },
      },
      {
        $group: {
          _id: '$populatedProduct._id',
          productName: { $first: '$populatedProduct.name' },
          totalSalesAmount: {
            $sum: { $multiply: [{ $toDouble: '$populatedProduct.price' }, '$products.quantity'] },
          },
          totalProductsSold: { $sum: '$products.quantity' },
        },
      },
      {
        $group: {
          _id: null,
          totalSalesAmount: { $sum: '$totalSalesAmount' },
          totalProductsSold: { $sum: '$totalProductsSold' },
        },
      },
    ]).exec();
    console.log('orderdata',orderDataData);
    if (orderDataData.length > 0) {
     
      const { totalSalesAmount, totalProductsSold } = orderDataData[0];

      const profit = Math.floor(totalSalesAmount * 0.3);

      const salesReport = {
        profit,
        totalSalesAmount,
        totalProductsSold,
      };
     

      return salesReport;
    } else {
      console.error("No sales data found for the specified interval");
      return null; // or handle this case according to your requirements
    }
    

  } catch (error) {
    console.error("Error generating the sales report:", error.message);
    res.render('500')
  }
};



// ==========================RECENT ORDERS========================================
const recentOrder = async () => {
  try {
    const orders = await Order.find();
    // console.log('my orders',orders);

    const productWiseOrdersArray = [];

    for (const order of orders) {
      for (const productInfo of order.products) {
        const productId = productInfo.productId;
        // console.log("id",productId );

       const product = await Product.findById(productId).select(
          "name image price"
        );
        // console.log("produc",product);
        const userDetails = await User.findById(order.user).select(
          "email"
        );
        // console.log("user",userDetails);
        if (product) {
          // Push the order details with product details into the array
          orderDate = await formatDate(order.date);
          productWiseOrdersArray.push({
            user: userDetails,
            product: product,
            orderDetails: {
              _id: order._id,
              userId: order.user,
              shippingAddress: order.deliveryDetails,
              orderDate: orderDate,
              totalAmount: productInfo.quantity * product.price,
              OrderStatus: productInfo.orderStatus,
              StatusLevel: productInfo.statusLevel,
              paymentMethod: order.paymentMethod,
              paymentStatus: productInfo.paymentStatus,
              quantity: productInfo.quantity,
            },
          });
        }  
      }
    }

    
    return productWiseOrdersArray.slice(0,10);
  } catch (error) {}
};
// =======================================================

// ======== This Function used to formmate date from new Date() function ====
function formatDate(date) {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
}



// ===== setting start date and end date ========
const getStartDate = (interval) => {
  const start = new Date();
  if (interval === "week") {
    start.setDate(start.getDate() - start.getDay()); // Start of the week
  } else if (interval === "year") {
    start.setMonth(0, 1); // Start of the year
  }
  return start;
};

const getEndDate = (interval) => {
  const end = new Date();
  if (interval === "week") {
    end.setDate(end.getDate() - end.getDay() + 6); // End of the week
  } else if (interval === "year") {
    end.setMonth(11, 31); // End of the year
  }
  return end;
};


    //    LOAD ADMIN LOGIN

    
const loadLogin=async (req,res)=>{
    try {
        
        res.render('admin-login')
    } catch (error) {
        console.log(error);
        res.render('500')
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
        res.render('500')
    }
}
 
             // LOAD CATEGORY PAGE


const loadaddCategory=(req,res)=>{
    try {
        res.render('add-category')
    } catch (error) {
        console.log(error);
        res.render('500')
    }
}
             // LOAD ADMIN LOGOUT


const logOut=async (req,res)=>{
    try {
        req.session.Admin=false
        res.redirect('/admin')
    } catch (error) {
        console.log(error);
        res.render('500')
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
        res.render('500')
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
        res.render('500')
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
        res.render('500')
  
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
    res.render('500')
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
    res.render('500')
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
    productInfo.paymentStatus = "Refunded";
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
    res.render('500')
  }
}
//     console.log(orderDataData);
    
    
//     const { totalSalesAmount, totalProductsSold } = orderDataData[0];

//     const profit =Math.floor(totalSalesAmount*0.3) 

// const salesReport = {
//   profit,
//   totalSalesAmount,
//   totalProductsSold
// };


//     return salesReport;

const errorrPage=async (req,res)=>{
  try {
    res.render('404')
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
    cancelOrderadmin,
    errorrPage
    

}