const Address=require('../model/addressModel')
const User=require('../model/userModel')
const { ObjectId } = require("mongodb")
const Cart=require('../model/cartModel')


const  addAddress=async(req,res)=>{
    try {
        res.render('add-address',{user:req.session.user})
    } catch (error) {
        console.log(error);
    }
}

const insertAddress = async (req, res) => {
    try {
      const name = req.session.user
      const userData = await User.findOne({name:name});
      const userId=userData._id
  
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
        res.redirect("/profile");
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
        res.redirect("/profile");
      }
    } catch (error) {
      console.log(error);
    
    }
  };

  const editAddress=async (req,res)=>{
    try {
        const addressId=req.query.id
        const name=req.session.user
        console.log('name ',name);
        const userData=await User.findOne({name:name})
        console.log('userdata',userData);
        const userId=userData._id
        console.log('useridd  ',userId);
        const address=await Address.findOne({user:new ObjectId(userId)},{address:{$elemMatch:{_id:new ObjectId(addressId)}}})
        console.log(address);

        const addres=address.address[0]
      res.render('edit-address',{user:req.session.user,address:addres})
    } catch (error) {
     console.log(error); 
    }
  }


  const updateAddress=async (req,res)=>{
    try {
         const name=req.session.user
         const userData=await User.findOne({name:name})
         const userId=userData._id
         const addressId=req.body.id
         console.log('name:',name);
         console.log('userdata:',userData);
         
          
         const details =await Address.updateOne({user: new ObjectId(userId),"address._id":addressId},{
          $set:{
            "address.$.name":req.body.name,
            "address.$.pin":req.body.pin,
            "address.$.city":req.body.city,
            "address.$.mobile":req.body.mobile,
            "address.$.state":req.body.state,
            "address.$.housename":req.body.housename,
            "address.$.email":req.body.email
          }
        
         })
         res.redirect('/profile')

    } catch (error) {
      console.log(error);
    }
  }

  const loadCheckout=async (req,res)=>{
    try {
    //   const name=req.session.user
    //   const userData=await User.findOne({name:name})
    //   const userId=userData._id
    //    const address=await Address.findOne({user:new ObjectId(userId)})
    //   const cartData=await Cart.findOne({user:userId}).populate("products.productId")
    //   const cart=await Cart.findOne({user:userId})
    //           let Total
    //   let total=await Cart.aggregate([
    //       {$match:{user:new ObjectId(userId)}},
    //       {$unwind: "$products"},
    //       {
    //         $project:{
    //           price:"$products.price",
    //           quantity:"$products.quantity"
    //         },
    //       },  
    //         {
    //           $group:{
    //             _id:null,
    //             total:{
    //               $sum:{
    //                 $multiply:["$price","$quantity"]
    //               }
    //             }
  
    //           }
    //         }
          
    //   ])

    //  Total=total[0].total
    if(req.session.user){
        const name=req.session.user
        const userData=await User.findOne({name:name})
        console.log(userData);
        const userId=userData._id
        console.log(userId);
        const address=await Address.findOne({user:new ObjectId(userId)})
        console.log(address);


      res.render('checkout',{user:req.session.user,address:address.address})
    }else{
      res.render('checkout',{message:"user logged"})
    }
     
      
      


         
        //  ,{user:req.session.user,total:Total,address:address.address,data : cartData.products}
    } catch (error) {
      console.log(error);
    }
  }

module.exports={
    addAddress,
    insertAddress,
    editAddress,
    updateAddress,
   loadCheckout

}