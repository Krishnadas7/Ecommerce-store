const mongoose=require('mongoose')
const express=require('express')
const app=express()
const path=require('path')
const dotenv=require('dotenv')
dotenv.config()

const dbConnect = async ()=>{
  try{
    await mongoose.connect(process.env.MONGO_DB);
  }catch(error){
    console.log(error);
    
  }
  
}


 
 
app.use('/public',express.static(path.join(__dirname,'public')))
  
app.use(express.json());
app.use(express.urlencoded({ extended: true }));  

app.use((req, res, next) => { 
    res.locals.req = req;  
    next();   
  });     
           
  
const disable = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '1');
  next(); 
}
app.use(disable);

app.set('view engine','ejs')  
app.set('views','./view/users')


// for user route
const userRouter=require('./routes/userRouter')
app.use('/',userRouter)

// for admin Route
const adminRouter=require('./routes/adminRouter')
app.use('/admin',adminRouter)

app.use('*',(req,res)=>{
  try {
    res.render('404')
  } catch (error) {
    console.log(error);
  }
})


app.listen(process.env.PORT,()=>{
    console.log('server connected');
    dbConnect()
})     