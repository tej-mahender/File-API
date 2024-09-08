//import and use express module
const exp=require('express')
const app=exp();

require('dotenv').config()
const cors=require('cors');
app.use(cors({
    origin:'http://localhost:5173'
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

    //share collection obj to APIs 
    app.set('users',users) 
    app.set('TestCourses',TestCourses)

    //assign port number to http server of express app
    app.listen(process.env.PORT,()=>console.log("http server started on port 4000"))
})
.catch(err=>console.log(err))
//import userApp express object
const userApp = require('./APIs/userApi');
const courseApp = require('./APIs/courseApi');

//if path starts with user-api forward to userApp
app.use('/user-api',userApp)
app.use('/course-api',courseApp)

//handling invalid paths
app.use('*',(req,res,next)=>{
    res.send({message:`invalid path ${req.url}`})
})

//error handling middleware
app.use((err,req,res,next)=>{
    res.send({message:"error occured",errorMessage:err.message})
})

// const express = require('express');
// const mongoose = require('mongoose');
// const multer = require('multer'); // For handling file uploads
// const app = express();

// // Connect to MongoDB Atlas
// mongoose.connect('mongodb+srv://<username>:<password>@cluster.mongodb.net/<database>?retryWrites=true&w=majority', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// });

// // Middleware for parsing incoming form-data
// const upload = multer({ dest: 'uploads/' });

// // Dynamic schema for storing course data
// function getCourseSchema(courseName) {
//   return new mongoose.Schema({
//     filename: String,
//     filepath: String,
//     uploadedBy: String,
//     uploadedAt: { type: Date, default: Date.now }
//   }, { collection: courseName });
// }

// // Upload file route
// app.post('/upload', upload.single('file'), (req, res) => {
//   const { courseName, uploadedBy } = req.body;
//   const file = req.file;

//   // Dynamically create or retrieve the schema for the course
//   const Course = mongoose.model(courseName, getCourseSchema(courseName));

//   // Save file data into the course collection
//   const newFileEntry = new Course({
//     filename: file.originalname,
//     filepath: file.path,
//     uploadedBy: uploadedBy,
//   });

//   newFileEntry.save()
//     .then(() => res.status(200).send('File uploaded and stored in ' + courseName + ' collection.'))
//     .catch(err => res.status(500).send('Error uploading file: ' + err));
// });

// app.listen(3000, () => console.log('Server started on port 3000'));
