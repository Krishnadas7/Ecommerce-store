const User=require('../model/userModel')


const loadUsermanagement=async (req,res)=>{
    try {
        var search=''
        if(req.query.search){
            search=req.query.search
        }
        const user=await User.find({
            $or:[
                { name: { $regex: new RegExp(search, 'i') } }
            ]
        })
    
        res.render('user-management',{user:user})
    } catch (error) {
        console.log(error);
    }
}

const blockUnblock=async (req,res)=>{
    try {
        let id=req.query.id
        console.log(id);
        const user=await User.findById({_id:id})
      
        if (user.isListed===true) {
            const block=await User.findByIdAndUpdate({_id:id},{$set:{isListed:false}})
        }else{
            const block=await User.findByIdAndUpdate({_id:id},{$set:{isListed:true}})
        }

          res.redirect('/admin/user-management')
    } catch (error) {
       console.log(error); 
    }
}


module.exports={
    loadUsermanagement,
    blockUnblock
}