const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../../schemas/UserSchema');
const Post = require('../../schemas/PostSchema');
const Chat = require('../../schemas/ChatSchema');
const Notification = require('../../schemas/NotificationsSchema');
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
       
       var chat = await Chat.findByIdAndUpdate(req.body.chatId, {latestMessage: msg})
       .catch(e=>console.log(e));

       insertNotifications(chat, msg);

       res.status(201).send(msg);
   })
   .catch(e=>{
       console.log(e);
       res.sendStatus(400);
   })
})


function insertNotifications(chat, message){
    chat.users.forEach(userId => {
        if(userId == message.sender._id.toString()) return;

        Notification.insertNotification(userId, message.sender._id, "newMessage", message.chat._id);
    } )
}

module.exports = router;