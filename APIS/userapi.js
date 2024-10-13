const exp = require('express');
const moment = require('moment');
const userApp = exp.Router();
const {db}=require('mongodb')
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const tokenVerify = require('../middlewares/tokenVerify')
const expressAsyncHandler=require('express-async-handler')
//app body parser middleware
userApp.use(exp.json())
require('dotenv').config();
//create sample rest api(req handlers-routes)
//route for get users (public route)
userApp.get('/users',tokenVerify,expressAsyncHandler(async (req,res)=>{
    //get user collection obj
    const userCollection=req.app.get('users');
    //get users data from collection of DB
    let usersdata=await userCollection.find().toArray();
    //send users data to client
    res.send({message:"users", payload:usersdata})
}))
//route to get specific user by username (protected route)
userApp.get('/users/:username',tokenVerify,expressAsyncHandler(async(req,res)=>{
   //get userCollection obj
   const userCollection=req.app.get('users');
   //get id from url
   const usernameURL=req.params.username;
   //find user by username
   let user=await userCollection.findOne({username:{$eq:{usernameURL}}});
   //send res
   res.send({message:"user",payload:user})
}))
//route to post or create user (public route)
userApp.post('/user',expressAsyncHandler(async (req,res)=>{
    const userCollection=req.app.get('users');
    //get user data from req body
    const user=req.body;

    //verify duplicate user
    let existUser = await userCollection.findOne({username:user.username})
    if(existUser!==null){
        res.send({message:"user already exist",payload:existUser})
    }else{
        //hash the password
        let hashPass=await bcryptjs.hash(user.password,7)
        //replace pass with Hashpass
        user.password=hashPass;
        user.uploads=[];
        user.saved=[];
        user.liked=[];
        //save user
        await userCollection.insertOne(user)
        let totalUsers = await userCollection.countDocuments();
        //send res
        res.send({message:"user created",payload:{existUser,totalUsers}})
    }

}))
userApp.get('/users-count', expressAsyncHandler(async (req, res) => {
    const userCollection = req.app.get('users');
    let totalUsers = await userCollection.countDocuments();
    res.send({ message: "Total users fetched", payload: { totalUsers } });
}));
//user login or authentication (public route)
userApp.post('/login',expressAsyncHandler(async(req,res)=>{
    const userCollection=req.app.get('users');
    //get user data from req body
    const user=req.body;
    //verify user
    let dbUser=await userCollection.findOne({username:user.username})
    if(dbUser===null){
        res.send({message:"invalid username"})
    } 
    else{
        //compare password
        let result=await bcryptjs.compare(user.password,dbUser.password)
        //if passwords not matched
        if(result===false){
            res.send({message:"invalid password"})
            }
            //if passwords matched
            else{
                //create JWT token
            let signedToken=jwt.sign({username:user.username},process.env.SECRET_KEY,{expiresIn:'1h'})
            //send res
            res.send({message:"login success",
                token:signedToken,
                user:{
                    username:dbUser.username,
                    _id: dbUser._id,
                }})
            }
    }
}))

//route to update user (protected route)
userApp.put('/user',expressAsyncHandler(async (req,res)=>{
    const userCollection=req.app.get('users');
    //get modified user data from req body
    let modified=req.body
    //modify by username
    await userCollection.updateOne({username:modified.username},{$set:{...modified}})
    //send res
    res.send({message:"user updated"})

}))

//route to delete user (protected route)
userApp.delete('/user/:username',tokenVerify,expressAsyncHandler(async (req,res)=>{
   const userCollection=req.app.get('users');
   //get username from req params
   let usernameURL=req.params.username
   //delete by username
   let deletedUser=await userCollection.deleteOne({username:usernameURL})
   //send res
   res.send({message:"user deleted",payload:deletedUser})
}))
userApp.put('/add-to-saved/:username',expressAsyncHandler(async(req,res)=>{
    //get user collection obj
    const userCollection=req.app.get('users');
     let usernameURL=req.params.username;
     let productObj=req.body;
    let result= await userCollection.updateOne({username:usernameURL},{$push:{saved:productObj}})
    console.log(result)
    res.send({message:"file added to saved",payload:result})
 }))

 userApp.put('/add-to-liked/:username',expressAsyncHandler(async(req,res)=>{
    //get user collection obj
    const userCollection=req.app.get('users');
     let usernameURL=req.params.username;
     let productObj=req.body;
    let result= await userCollection.updateOne({username:usernameURL},{$push:{liked:productObj}})
    console.log(result)
    res.send({message:"file added to liked",payload:result})
 }))
 userApp.put('/remove-from-liked/:username',expressAsyncHandler(async(req,res)=>{
    //get user collection obj
    const userCollection=req.app.get('users');
     let usernameURL=req.params.username;
     let productObj=req.body;
    let result= await userCollection.updateOne({username:usernameURL},{$pull:{liked:productObj}})
    console.log(result)
    res.send({message:"file deleted from liked",payload:result})
 }))
 userApp.get('/user-streak/:username', async (req, res) => {
    const username = req.params.username;
    try {
      const uploadsCollection =req.app.get('users');
      console.log(uploadsCollection);
      // Fetch all uploads for the user, sorted by date (newest first)
      const uploads = await uploadsCollection.find({ username }).sort({ date: -1 }).toArray();
      if (!uploads.length) {
        return res.status(200).json({ currentStreak: 0, longestStreak: 0 });
      }
      // Calculate streaks
      let currentStreak = 0;
      let longestStreak = 0;
      let streak = 0;
      let today = moment().startOf('day');
  
      for (let i = 0; i < uploads.length; i++) {
        let uploadDate = moment(uploads[i].date).startOf('day');
        let difference = today.diff(uploadDate, 'days');
  
        if (difference === 0 || difference === 1) {
          streak++;
          currentStreak = streak;
          today = today.subtract(1, 'days');
        } else {
          if (streak > longestStreak) {
            longestStreak = streak;
          }
          streak = 0;
          today = moment(uploads[i].date).startOf('day');
        }
      }
  
      // Update longest streak if current streak was the longest
      if (streak > longestStreak) {
        longestStreak = streak;
      }
  
      res.status(200).json({
        currentStreak,
        longestStreak
      });
    } catch (err) {
      console.error('Error fetching user streak:', err);
      res.status(500).json({ error: 'Error fetching user streak' });
    }
  });
 //fetch user uploads
 userApp.get('/user-uploads/:username', expressAsyncHandler(async (req, res) => {
    const userCollection = req.app.get('users');
    const usernameURL = req.params.username;

    try {
        const user = await userCollection.findOne({ username: usernameURL });

        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        const uploads = user.uploads;
        const uploadCount = uploads.length; // Get the count of uploads

        res.send({
            message: "User uploads",
            payload: {
                uploads,
                uploadCount // Ensure you are sending the correct key here
            }
        });
    } catch (error) {
        console.error('Error fetching user uploads:', error);
        res.status(500).send({ error: 'Error fetching user uploads', details: error.message });
    }
}));
userApp.delete('/delete-uploads/:username', expressAsyncHandler(async (req, res) => {
    const userCollection = req.app.get('users');
    const usernameURL = req.params.username;
    const { driveLink, fileName } = req.body; 
    try {
        const result = await userCollection.updateOne(
            { username: usernameURL }, 
            { $pull: { uploads: { driveLink: driveLink, fileName: fileName } } } 
        );
        if (result.modifiedCount > 0) {
            res.send({ message: 'File successfully deleted from array' });
        } else {
            res.status(404).send({ message: 'File not found or already deleted' });
        }
    } catch (error) {
        console.error('Error deleting file from array:', error);
        res.status(500).send({ error: 'Error deleting file', details: error.message });
    }
}));

userApp.get('/user-uploads/:username/daily', expressAsyncHandler(async (req, res) => {
    const userCollection = req.app.get('users');
    const usernameURL = req.params.username;
    try {
        const user = await userCollection.findOne({ username: usernameURL });
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }
        if (!user.uploads || user.uploads.length === 0) {
            return res.send({ message: "No uploads found", payload: [] });
        }
        // Aggregating uploads by date
        const uploadCountsByDate = user.uploads.reduce((acc, upload) => {
            const uploadDate = new Date(upload.uploadDate);
            if (isNaN(uploadDate.getTime())) { // Check if date is valid
                console.error('Invalid date value:', upload.uploadDate);
                return acc; // Skip invalid date entries
            }
            const date = uploadDate.toISOString().split('T')[0]; // format the date
            acc[date] = (acc[date] || 0) + 1; // increment the count for each date
            return acc;
        }, {});
        const formattedData = Object.entries(uploadCountsByDate).map(([date, count]) => ({
            date,
            uploads: count
        }));
        res.send({
            message: "User uploads",
            payload: formattedData // Send the aggregated data
        });
    } catch (error) {
        console.error('Error fetching user uploads:', error);
        res.status(500).send({ error: 'Error fetching user uploads', details: error.message });
    }
}));

  //fetch user saved
  userApp.get('/user-saved/:username',expressAsyncHandler(async(req,res)=>{
    const userCollection=req.app.get('users');
    let usernameURL=req.params.username;
    try {
        const user = await userCollection.findOne({ username: usernameURL });

        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }
    let saved=user.saved
    const savedcount=saved.length;
    res.send({
        message: "User Saved",
        payload: {
            saved,
            savedcount
        }
    });
} catch (error) {
    console.error('Error fetching user saved:', error);
    res.status(500).send({ error: 'Error fetching user saved data', details: error.message });
}
 }))

  //fetch user liked
  userApp.get('/user-liked/:username',expressAsyncHandler(async(req,res)=>{
    const userCollection=req.app.get('users');
    let usernameURL=req.params.username;
    try {
        const user = await userCollection.findOne({ username: usernameURL });

        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }
    let liked=user.liked
    let likedcount=liked.length;

   res.send({
        message: "User Liked",
        payload: {
            liked,
            likedcount
        }
    });
} catch (error) {
    console.error('Error fetching user saved:', error);
    res.status(500).send({ error: 'Error fetching user saved data', details: error.message });
}
 }))
 userApp.get('/user-uploads/:username/', async (req, res) => {
    const { username } = req.params; // Use the correct param name
  
    try {
      // Aggregate uploads by date for the given user
      const uploads = await Uploads.aggregate([
        { $match: { uploaderName: username } }, // Match on uploader's name
        { $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$uploadDate" } }, // Group by uploadDate
            count: { $sum: 1 } // Count the number of uploads for each day
          }
        },
        { $sort: { _id: 1 } } // Sort by date
      ]);
  
      // Format the response
      const responseData = uploads.map(upload => ({
        date: upload._id,  // Date in 'YYYY-MM-DD' format
        uploads: upload.count  // Number of uploads
      }));
  
      res.json({ message: 'User uploads', payload: responseData });
    } catch (error) {
      console.error('Error fetching upload data:', error);
      res.status(500).json({ message: 'Error fetching data' });
    }
  });
  
module.exports = userApp;