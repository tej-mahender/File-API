const exp = require('express');
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
// userApp.get('/users',tokenVerify,expressAsyncHandler(async (req,res)=>{
//     //get user collection obj
//     const userCollection=req.app.get('users');
//     //get users data from collection of DB
//     let usersdata=await userCollection.find().toArray();
//     //send users data to client
//     res.send({message:"users", payload:usersdata})
// }))
//route to get specific user by username (protected route)
// userApp.get('/users/:username',tokenVerify,expressAsyncHandler(async(req,res)=>{
//    //get userCollection obj
//    const userCollection=req.app.get('users');
//    //get id from url
//    const usernameURL=req.params.username;
//    //find user by username
//    let user=await userCollection.findOne({username:{$eq:{usernameURL}}});
//    //send res
//    res.send({message:"user",payload:user})
// }))

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

 
 userApp.put('/remove-from-saved/:username', expressAsyncHandler(async (req, res) => {
    const userCollection = req.app.get('users');
    let usernameURL = req.params.username;
    let file = req.body;
    let result = await userCollection.updateOne(
      { username: usernameURL },
      { $pull: { saved: file } }
    );
    console.log(result);
    res.send({ message: "file removed from saved", payload: result });
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

 //fetch user uploads
 userApp.get('/user-uploads/:username',expressAsyncHandler(async(req,res)=>{
    const userCollection=req.app.get('users');
    let usernameURL=req.params.username;
    let user=await userCollection.findOne({username:usernameURL})
    let uploads=user.uploads
    res.send({message:"user uploads",payload:uploads})
 }))

  //fetch user saved
  userApp.get('/user-saved/:username',expressAsyncHandler(async(req,res)=>{
    const userCollection=req.app.get('users');
    let usernameURL=req.params.username;
    let user=await userCollection.findOne({username:usernameURL})
    let saved=user.saved
    res.send({message:"user saved",payload:saved})
 }))

  //fetch user liked
  userApp.get('/user-liked/:username',expressAsyncHandler(async(req,res)=>{
    const userCollection=req.app.get('users');
    let usernameURL=req.params.username;
    let user=await userCollection.findOne({username:usernameURL})
    let liked=user.liked
    res.send({message:"user liked",payload:liked})
 }))

module.exports = userApp;