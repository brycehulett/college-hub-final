const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../../schemas/UserSchema');
const Post = require('../../schemas/PostSchema');
const Chat = require('../../schemas/ChatSchema');
const Message = require('../../schemas/MessageSchema');

app.use(bodyParser.urlencoded({extended: false}))

// handles the route
router.post("/", async(req, res, next)=>{
   if(!req.body.content || !req.body.chatId){
       console.log('invalid data passed to request');
       return res.sendStatus(400);
   }
   var newMessage = {
       sender: req.session.user._id,
       content: req.body.content,
       chat: req.body.chatId
   }

   Message.create(newMessage)
   .then(async msg =>{
       msg = await msg.populate("sender");
       msg = await msg.populate("chat");
       msg = await User.populate(msg, {path: "chat.users"});
       
       Chat.findByIdAndUpdate(req.body.chatId, {latestMessage: msg})
       .catch(e=>console.log(e));

       res.status(201).send(msg);
   })
   .catch(e=>{
       console.log(e);
       res.sendStatus(400);
   })
})

module.exports = router;