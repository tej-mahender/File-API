
//import and use express module
const exp=require('express')
const app=exp();

require('dotenv').config()
const cors=require('cors');
app.use(cors({
   // origin:'http://localhost:5173'
    origin:'https://resolink-mocha.vercel.app'
     // origin:'*'
}))

//import mongo client
const {MongoClient}=require('mongodb');
let mC=new MongoClient(process.env.DB_URL);
mC.connect()
    .then((connectionObj)=>{
        console.log("Connected to db")
    //connect to a database
    const backend = connectionObj.db('ResoLink')
    
    //connect to a collection
    const users = backend.collection('users')
    const TestCourses = backend.collection('TestCourses')
    const courses = backend.collection('courses')

    //share collection obj to APIs 
    app.set('users',users) 
    app.set('TestCourses',TestCourses)
    app.set('courses',courses)

    //assign port number to http server of express app
    app.listen(process.env.PORT,()=>console.log(`Server started on port ${process.env.PORT}`))
})
.catch(err=>console.log(err))

//import userApp express object
const courseApp = require('./APIS/courseApi');
const userApp = require('./APIS/userapi');
//if path starts with user-api forward to userApp
app.use('/user-api',userApp)
app.use('/course-api',courseApp)

//handling invalid paths
app.use('*',(req,res,next)=>{
    res.send({message:`invalid path ${req.url}`})
})

//error handling middleware
app.use((err,req,res,next)=>{
    res.send({message:"Error occured",errorMessage:err.message})
})
