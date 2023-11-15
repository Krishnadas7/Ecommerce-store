const mongoose=require('mongoose')
const referralSchema=new mongoose.Schema({
    referralUserId: {
         type: mongoose.Schema.Types.ObjectId ,
          ref: 'User', 
          required:true
        },
    referringUserId: { 
        type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
          required: true
         },
    amount: { 
        type: Number,
         default: 100
         },

})
const Referral = mongoose.model('Referral', referralSchema);

module.exports = Referral;