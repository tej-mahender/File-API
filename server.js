const exp=require('express')
const app=exp();
app.use(exp.json())
let userlist=[
 {id:1,name:"vimala"},
 {id:2,name:"reddy"}
]
app.get('/users',(req,res)=>{
    res.send({message:"all users"})
})
app.get('/users/:id',(req,res)=>{
    let useridbyurl=Number(req.params.id)
    let userid=userlist.find(user=>user.id===useridbyurl)
    if(userid===undefined){
     res.send({message:"not defined"})
     console.log(userid)
    }
    else
    res.send({message:"one user",payload:userid})
})
app.post('/user',(req,res)=>{
    let newuser=req.body
    userlist.push(newuser)
    res.send({message:"New user",payload:userlist})
})
app.put('/user',(req,res)=>{
    let modifieduser=req.body
    let index=userlist.findIndex(user=>user.id===modifieduser.id)
    if(index===-1)
        res.send({message:"user not found"})
else{    
    userlist[index]=modifieduser
    res.send({message:"Modified user"})
}
})
app.delete('/users/:id',(req,res)=>{
    let useridbyurl=Number(req.params.id)
    let index=userlist.findIndex(user=>user.id===useridbyurl)
    if(index===-1){
     res.send({message:"not defined"})
    }
    else{
    userlist.splice(index,1)
    res.send({message:"user deleted",payload:userlist})
    }
})
app.listen(4000,()=>console.log("Http server is activated"))