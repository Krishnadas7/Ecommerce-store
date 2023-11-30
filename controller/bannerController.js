const Banner=require('../model/banner')

const loadAddBanner =async (req,res)=>{
    try {
        res.render('add-banner')
    } catch (error) {
        console.log(error);
        res.render('500')
    }
}
const postBanner = async (req, res) => {
    try {
       
        const image = req.file.filename; 
        const croppedImage1Buffer = Buffer.from(req.body.croppedImage.replace(/^data:image\/jpeg;base64,/, ''), 'base64');
      
        const title = req.body.title;
        const description = req.body.description;

        let banner = new Banner({
            title: title,
            description: description,
            image: image,
            status: true
        });

        let result = await banner.save();
        res.redirect('/admin/banner-detials');
    } catch (error) {
        console.log(error);
        res.render('500');
    }
}
const loadBannerDetails =async (req,res)=>{
    try {
     const banner=await Banner.find()

        res.render('banner-details',{banner:banner})
    } catch (error) {
        console.log(error);
        res.render('500')
    }
}
const blockBanner=async(req,res)=>{
    try {
    const id=req.query.id
    

    const banner = await Banner.findOne({_id:id})
    if(banner.status == true){
        await Banner.updateOne({_id:id},{$set:{status: false}})
    }else{
        await Banner.updateOne({_id:id},{$set:{status: true}})
    }
    if(banner){
        res.redirect('/admin/banner-detials')
    }else{
        console.console.log('not get');
    }
    } catch (error) {
        console.log(error);
        res.render('500')
    }
}
const editBanner=async (req,res)=>{
    try {

        const bannerId = req.query.id
        const banner = await Banner.findOne({_id:bannerId})
        res.render('edit-banner',{banner:banner})
    } catch (error) {
        console.log(error);
        res.render('500')
    }
}
const updateBanner =async (req,res)=>{
    try {
        const updated = await Banner.updateOne({_id:req.query.id},{$set:{
            title: req.body.title,
            description: req.body.description,
            image:req.file.filename
        }})
        if(updated){
            res.redirect('/admin/banner-detials')
        }else{
            console.log('not updated');
        }
    } catch (error) {
        console.log(error);
        res.render('500')
    }
}
module.exports={
    loadAddBanner,
    postBanner,
    loadBannerDetails,
    blockBanner,
    editBanner,
    updateBanner
}