const User=require('../model/userModel')
const Cart=require('../model/cartModel')

const cartMiddleware=async (req,res,next)=>{
    try {
        if(req.session.user){
        const name=req.session.user
        const userData= await User.findOne({name:name})

        if (!userData) {
           
            return res.redirect('/login');
          }
        const userId=userData._id

        const cart=await Cart.findOne({user:userId})
        const count = cart ? cart.products.length : 0;
        res.locals.count= count
        next()
        }else{
            const count=0
            res.locals.count= count
            next()
        }

    } catch (error) {
        console.log(error);
    }  
}
module.exports = cartMiddleware;