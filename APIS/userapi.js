const exp = require('express');
const userApp = exp.Router();
const {db}=require('mongodb')
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const tokenVerify = require('../middlewares/tokenVerify')
const expressAsyncHandler=require('express-async-handler')
const moment = require('moment')

//app body parser middleware
userApp.use(exp.json())
require('dotenv').config();

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
        //send res
        res.send({message:"user created",payload:existUser})
    }
}))

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
     let file=req.body;
    let result= await userCollection.updateOne(
        {username:usernameURL},
        {$addToSet:{saved:file}
    })
    console.log(result)
    res.send({message:"file added to saved",payload:result})
 }))

// Backend route to remove a file from saved items
userApp.put('/remove-from-saved/:username', expressAsyncHandler(async (req, res) => {
    const userCollection = req.app.get('users');
    const usernameURL = req.params.username;
    const file = req.body; // The file object to remove
  
    try {
      // Remove the file from the saved array
      const result = await userCollection.updateOne(
        { username: usernameURL },
        { $pull: { saved: { driveLink: file.driveLink, fileName: file.fileName } } } // Match by specific fields to ensure correct item removal
      );
  
      res.send({ message: 'File removed from saved', payload: result });
    } catch (err) {
      console.error('Error removing from saved:', err);
      res.status(500).send({ error: 'Error removing from saved', details: err.message });
    }
  }));
  
 userApp.put('/add-to-liked/:username',expressAsyncHandler(async(req,res)=>{
    //get user collection obj
    const userCollection=req.app.get('users');
     let usernameURL=req.params.username;
     let file=req.body;
    let result= await userCollection.updateOne({username:usernameURL},{$addToSet:{liked:file}})
    console.log(result)
    res.send({message:"file added to liked",payload:result})
 }))

 // Backend route to remove a file from liked items
userApp.put('/remove-from-liked/:username', expressAsyncHandler(async (req, res) => {
    const userCollection = req.app.get('users');
    const usernameURL = req.params.username;
    const file = req.body; // The file object to remove
  
    try {
      // Remove the file from the saved array
      const result = await userCollection.updateOne(
        { username: usernameURL },
        { $pull: { liked: { driveLink: file.driveLink, 
                            fileName: file.fileName } } } // Match by specific fields to ensure correct item removal
      );
  
      res.send({ message: 'File removed from liked', payload: result });
    } catch (err) {
      console.error('Error removing from liked:', err);
      res.status(500).send({ error: 'Error removing from liked', details: err.message });
    }
  }));

  //delete uploads
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

  //fetch user saved
  userApp.get('/user-saved/:username',expressAsyncHandler(async(req,res)=>{
    const userCollection=req.app.get('users');
    let usernameURL=req.params.username;
    try {
        const user = await userCollection.findOne({ username: usernameURL });
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }
        const saved = user.saved;
        res.send({
            message: "User saved",
            payload: {
                saved // Ensure you are sending the correct key here
            }
        });
    } catch (error) {
        console.error('Error fetching user saved:', error);
        res.status(500).send({ error: 'Error fetching user saved', details: error.message });
    }
 }))

  //fetch user liked
  userApp.get('/user-liked/:username',expressAsyncHandler(async(req,res)=>{
    const userCollection=req.app.get('users');
    const usernameURL = req.params.username;
    try {
        const user = await userCollection.findOne({ username: usernameURL });
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }
        const liked = user.liked;
        res.send({
            message: "User liked",
            payload: {
                liked // Ensure you are sending the correct key here
            }
        });
    } catch (error) {
        console.error('Error fetching user liked:', error);
        res.status(500).send({ error: 'Error fetching user liked', details: error.message });
    }
 }))


 userApp.get('/user-uploads/:username', expressAsyncHandler(async (req, res) => {
    const userCollection = req.app.get('users');
    const usernameURL = req.params.username;
    try {
        const user = await userCollection.findOne({ username: usernameURL });
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }
        const uploads = user.uploads;
        res.send({
            message: "User uploads",
            payload: {
                uploads // Ensure you are sending the correct key here
            }
        });
    } catch (error) {
        console.error('Error fetching user uploads:', error);
        res.status(500).send({ error: 'Error fetching user uploads', details: error.message });
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


userApp.get('/user-streak/:username', async (req, res) => {
    const username = req.params.username;
    try {
      const uploadsCollection = req.app.get('users');
      console.log(uploadsCollection);
  
      // Fetch all uploads for the user, sorted by date (newest first)
      const uploads = await uploadsCollection.find({ username }).sort({ date: -1 }).toArray();
  
      // If no uploads are found, return zero streaks
      if (!uploads.length) {
        return res.status(200).json({ currentStreak: 0, longestStreak: 0 });
      }
  
      let currentStreak = 0;
      let longestStreak = 0;
      let streak = 1; // Initialize streak to 1 for the first upload
      let today = moment().startOf('day');
  
      // Iterate through the uploads starting from the first (newest) upload
      for (let i = 0; i < uploads.length; i++) {
        let uploadDate = moment(uploads[i].date).startOf('day');
  
        // If this is the first upload, set the current day to this upload date
        if (i === 0) {
          today = uploadDate;
          currentStreak = 1; // Start counting the current streak
          continue;
        }
  
        // Calculate the difference between the current upload and the previous upload
        let previousUploadDate = moment(uploads[i - 1].date).startOf('day');
        let difference = previousUploadDate.diff(uploadDate, 'days');
  
        // Continue streak if the dates are consecutive
        if (difference === 1) {
          streak++;
          currentStreak = streak;
        } else if (difference > 1) {
          // If the dates are not consecutive, reset the streak
          if (streak > longestStreak) {
            longestStreak = streak; // Update longest streak before resetting
          }
          streak = 1; // Reset streak for the next set of consecutive dates
        }
      }
  
      // Update the longest streak if the last streak was the longest
      if (streak > longestStreak) {
        longestStreak = streak;
      }
  
      res.status(200).json({
        currentStreak,
        longestStreak,
      });
    } catch (err) {
      console.error('Error fetching user streak:', err);
      res.status(500).json({ error: 'Error fetching user streak' });
    }
  });
  
module.exports = userApp;