const mongoose=require('mongoose')
const express=require('express')
const app=express()

mongoose.connect('mongodb://127.0.0.1:27017/ecommerce');

  
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// for user route
const userRouter=require('./routes/userRouter')
app.use('/',userRouter)

// for admin Route
// const adminRouter=require('./routes/adminRouter')
// adminRouter.use('/admin',adminRouter)

const PORT=process.env.PORT||3000
app.listen(PORT,()=>{
    console.log('server connected');
})