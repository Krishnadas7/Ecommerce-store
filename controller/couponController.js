const Coupon=require('../model/couponModel')
const Cart=require('../model/cartModel')
const User=require('../model/userModel')

const loadAddCoupon=async (req,res)=>{
    try {
       
        res.render('add-coupon')
    } catch (error) {
        console.log(error);
    }
}
const viewCoupon=async (req,res)=>{
    try {
        const coupons=await Coupon.find()
        res.render('view-coupon',{coupons:coupons})
    } catch (error) {
        console.log(error);
    }
}

const addCoupon = async (req, res) => {
    try {
      const regexName = new RegExp(req.body.name, 'i');
      const already = await Coupon.findOne({ couponName: { $regex: regexName } });
      const regexCode = new RegExp(req.body.code, 'i');
      const Codealready = await Coupon.findOne({ couponCode: { $regex: regexCode } });
      const TodayDate = new Date()
      const Today = TodayDate.toISOString().split('T')[0];
      const active = req.body.activeDate;
      if(req.body.name.trim() === "" && req.body.code.trim() === "" && req.body.discount.trim() === "" && req.body.activeDate.trim() === "" && req.body.expDate.trim() === "" && req.body.criteriaAmount.trim() === "" && req.body.userLimit.trim() === ""){
        res.json({require:true})
      }else if(already){
        res.json({nameAlready:true})
      }else if(Codealready){
        res.json({codeAlready:true})
      }else if(req.body.discount <= 0){
        res.json({disMinus:true})
      }else if(req.body.criteriaAmount <= 0){
        res.json({amountMinus:true})
      }else if(active > req.body.expDate && req.body.expDate < Today){
        res.json({expDate:true})
      }else if(req.body.userLimit <= 0){
        res.json({limit:true})
      }else{
          const data = new Coupon({
          couponName: req.body.name,
          couponCode: req.body.code,
          discountAmount: req.body.discount,
          activationDate: req.body.activeDate,
          expiryDate: req.body.expDate,
          criteriaAmount: req.body.criteriaAmount,
          usersLimit: req.body.userLimit,
        });
        await data.save();
        res.json({success:true})
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const applyCoupon = async (req, res) => {
    try {
      const name=req.session.user
      const userData=await User.findOne({name:name})
      const userId=userData._id
      const code = req.body.code;
      req.session.code = code;
      const amount = Number(req.body.amount);
      const userExist = await Coupon.findOne({
        couponCode: code,
        usedUsers: { $in: [userId] },
      });
      
      if (userExist) {
        res.json({ user: true });
      } else {
        const couponData = await Coupon.findOne({ couponCode: code });
        
        if (couponData) {
          if (couponData.usersLimit <= 0) {
            res.json({ limit: true });
          } else {
            if (couponData.status == false) {
              res.json({ status: true });
            } else {
              if (couponData.expiryDate <= new Date()) {
                res.json({ date: true });
              }else if(couponData.activationDate >= new Date()){
                res.json({ active : true})
              }else {
                if (couponData.criteriaAmount >= amount) {
                  res.json({ cartAmount: true });
                } else {
                 
                    
                    const disAmount = couponData.discountAmount;
                    
                    
                    const disTotal = Math.round(amount - disAmount);
                      console.log('dissss',disTotal);
                    await Cart.updateOne({user:userId},{$set:{applied:"applied"}})
                                  
                    return res.json({ amountOkey: true, disAmount, disTotal });
                 
                }
              }
            }
          }
        } else {
          res.json({ invalid: true });
        }
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const deleteAppliedCoupon = async(req,res)=> {
    try {
      const name=req.session.user
      const userData=await User.findOne({name:name})
      const userId=userData._id
  
      const code = req.body.code;
      const couponData = await Coupon.findOne({ couponCode: code });
      const amount = Number(req.body.amount);
      const disAmount = couponData.discountAmount;
      const disTotal = Math.round(amount + disAmount);
      const deleteApplied = await Cart.updateOne({user:userId},{$set:{applied:"not"}})
      if(deleteApplied){
        res.json({success:true, disTotal})
      }
    } catch (error) {
      console.log(error.message);
    }
  }
  const blockCoupons = async (req, res) => {
    try {
      const coupon = await Coupon.findOne({ _id: req.query.id });
      if (coupon.status == true ) {
        await Coupon.updateOne(
          { _id: req.query.id },
          { $set: { status: false } }
        );
      } else {
        await Coupon.updateOne({ _id: req.query.id }, { $set: { status: true } });
      }
      res.redirect("/admin/view-coupon");
    } catch (error) {
      console.log(error.message);
    }
  };
  const showEditPage = async (req, res) => {
    try {
      const couponData = await Coupon.findOne({ _id: req.query.id });
      res.render("edit-coupon", { coupon: couponData });
    } catch (error) {
      console.log(error.message);
    }
  };
  const updateCoupon = async (req, res) => {
    try {
      const TodayDate = new Date()
      const Today = TodayDate.toISOString().split('T')[0];
      const active = req.body.activeDate;
      if(req.body.name.trim() === "" && req.body.code.trim() === "" && req.body.discount.trim() === "" && req.body.activeDate.trim() === "" && req.body.expDate.trim() === "" && req.body.criteriaAmount.trim() === "" && req.body.userLimit.trim() === ""){
        res.json({require:true})
      }else if(req.body.discount <= 0){
        res.json({disMinus:true})
      }else if(req.body.criteriaAmount <= 0){
        res.json({amountMinus:true})
      }else if(active > req.body.expDate && req.body.expDate < Today){
        res.json({expDate:true})
      }else if(req.body.userLimit <= 0){
        res.json({limit:true})
      }else{
        const updated = await Coupon.updateOne(
          { _id: req.query.id },
          {
            $set: {
              couponName: req.body.name,
              couponCode: req.body.code,
              discountAmount: req.body.discount,
              activationDate: req.body.activeDate,
              expiryDate: req.body.expDate,
              criteriaAmount: req.body.criteriaAmount,
              usersLimit: req.body.userLimit,
            },
          }
        );
        if(updated){
            res.json({success:true})
        }else{
            res.json({failed:true})
        }
      }
    } catch (error) {
      console.log(error.message);
    }
  };

module.exports={
    loadAddCoupon,
    viewCoupon,
    addCoupon,
    applyCoupon,
    deleteAppliedCoupon,
    blockCoupons,
    showEditPage,
    updateCoupon
}