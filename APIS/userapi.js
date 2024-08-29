// const exp = require('express');
// const userApp = exp.Router();
// const {db}=require('mongodb')
// const bcryptjs = require('bcryptjs')
// const jwt = require('jsonwebtoken')
// const expressasync=require('express-async-handler')
// userApp.use(exp.json())
// userApp.get('/users',tokenverify,expressasync(async (req,res)=>{
//     const userCollection=req.app.get('users');
//     let usersdata=await userCollection.find().toArray();
//     res.send({message:"users", payload:usersdata})
// }))
// userApp.get('/users/:username', async(req,res)=>{
//     const userCollection=req.app.get('users');
//     const usernameURL=req.params.username;
//     let user=await userCollection.findOne({username:{$eq:{usernameURL}}});
//     res.send({message:"user",payload:user})
// })
// userApp.post('/user',async (req,res)=>{
//     const userCollection=req.app.get('users');
//     const user=req.body;
//     let existUser = await userCollection.findOne({username:user.username})
//     if(existUser!==null){
//         res.send({message:"user already exist",payload:existUser})
//     }else{
//         let hashPass=await bcryptjs.hash(user.password,7)
//         user.password=hashPass;
//         await userCollection.insertOne(user)
//         res.send({message:"user created",payload:existUser})
//     }})
//     userApp.post('/login',async(req,res)=>{
//         const userCollection=req.app.get('users');
//         //get user data from req body
//         const user=req.body;
//         //verify user
//         let dbUser=await userCollection.findOne({username:user.username})
//         if(dbUser===null){
//             res.send({message:"invalid username"})
//         } 
//         else{
//             //compare password
//             let result=await bcryptjs.compare(user.password,dbUser.password)
//             //if passwords not matched
//             if(result===false){
//                 res.send({message:"invalid password"})
//                 }
//                 //if passwords matched
//                 else{
//                     //create JWT token
//                 let signedToken=jwt.sign({username:user.username},process.env.SECRET_KEY,{expiresIn:'1h'},)
//                 //send res
//                 res.send({message:"login success",token:signedToken,user:user})
//                 }
//         }
//     })
//     //route to update user
//     userApp.put('/user',expressasync(async(req,res)=>{
//       const userCollection=req.app.get("users");
//       let modified=req.body;
//       let modifieduser=await userCollection.updateOne({username:modified.username})
//       res.send({message:"user updated",payload:modifieduser})
//     }))
//     //route to delete user
//     userApp.delete('/user/:id',tokenverify,expressasync(async (req,res)=>{
//         const userCollection=req.app.get('users')
//         let usernameURL=req.params.username
//         let deleteuser=await userCollection.deleteOne({username:usernameURL})
//         res.send({message:"deleted",payload:deleteuser})
//     }))
//     userApp.put('/add-to-card/:username',expressasync(async (req,res)=>{
//        let cardCollection=req.app.get('users')
//        let carduser=req.params.username;
//        let productobj=req.body;
//        let res1=await cardCollection.updateOne({username:carduser},{$push:{products:productobj}})
//        res.send({message:"card updated",payload:res1})
//     }))
//     module.exports=userApp;