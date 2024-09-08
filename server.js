// //import and use express module
// const exp=require('express')
// const app=exp();
// const mongoose = require('mongoose');
// const coursesRouter = require('./routes/courses');
// app.use('/courses', coursesRouter);
// app.use(exp.json());
// require('dotenv').config()
// const cors=require('cors');
// app.use(cors({
//     origin:'http://localhost:5173'
// }))
// //import mongo client
// const {MongoClient}=require('mongodb');
// let mC=new MongoClient(process.env.DB_URL);
// mC.connect()
//     .then((connectionObj)=>{
//         console.log("Connected to db")
//     //connect to a database
//     const backend = connectionObj.db('ResoLink')
//     //connect to a collection
//     const users = backend.collection('users')

//     //share collection obj to APIs 
//     app.set('users',users) 
//     console.log("Users collection set:", users);
//     //assign port number to http server of express app
//     app.listen(process.env.PORT,()=>console.log("http server started on port 4000"))
// })
// .catch(err=>console.log(err))
// //import userApp express object
// const userApp = require('./APIs/userApi');

// //if path starts with user-api forward to userApp
// app.use('/user-api',userApp)

// //handling invalid paths
// app.use('*',(req,res,next)=>{
//     res.send({message:`invalid path ${req.url}`})
// })

// //error handling middleware
// app.use((err,req,res,next)=>{
//     res.send({message:"error occured",errorMessage:err.message})
// })
const express = require('express');
const app = express();
const { MongoClient } = require('mongodb');
require('dotenv').config();
const cors = require('cors');
// Middleware to parse JSON request bodies
app.use(express.json());
// Middleware to handle CORS
app.use(cors({
    origin: 'http://localhost:5173'
}));
// Import the router
const userApp = require('./routes/courses');
// Use the router for routes starting with /courses
app.use('/courses', userApp);
// Error handling for invalid paths
app.use('*', (req, res) => {
    res.status(404).json({ message: `Invalid path ${req.url}` });
});

// Error handling middleware
app.use((err, req, res, next) => {
    res.status(500).json({ message: 'Error occurred', errorMessage: err.message });
});

// Connect to MongoDB
const client = new MongoClient(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect()
    .then(() => {
        console.log("Connected to MongoDB");
        app.locals.db = client.db('ResoLink'); // Store the database reference in app.locals
        // Start the server
        app.listen(process.env.PORT, () => console.log(`Server started on port ${process.env.PORT}`));
    })
    .catch(err => console.log(err));

module.exports = { client }; 
