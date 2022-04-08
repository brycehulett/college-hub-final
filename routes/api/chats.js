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
    if(!req.body.users){
        console.log("users param not sent w/ request");
        return res.sendStatus(400);
    }

    var users = JSON.parse(req.body.users);

    if(users.length == 0){
        console.log("users array is empty");
        return res.sendStatus(400);
    }

    users.push(req.session.user); // add the user to the chat

    var chatData = {
        users,
        isGroupChat: true
    };

    Chat.create(chatData)
    .then(results => res.status(200).send(results))
    .catch(e=>{
        console.log(e);
        res.sendStatus(400);
    })
})

router.get("/", async (req, res, next)=>{
    Chat.find({users:{$elemMatch:{$eq:req.session.user._id}}})
    .populate("users")
    .populate("latestMessage")
    .sort({updatedAt: -1})
    .then(async results => {
        results = await User.populate(results, {path:"latestMessage.sender"});
        res.status(200).send(results);
    })
    .catch(e=>{
        console.log(e);
        res.sendStatus(400);
    })
})

router.get("/:chatId", async (req, res, next)=>{
    Chat.findOne({_id: req.params.chatId, users:{$elemMatch:{$eq:req.session.user._id}}})
    .populate("users")
    .then(results => res.status(200).send(results))
    .catch(e=>{
        console.log(e);
        res.sendStatus(400);
    })
})

router.put("/:chatId", async (req, res, next)=>{
    Chat.findByIdAndUpdate(req.params.chatId, req.body)
    .then(results => res.sendStatus(204))
    .catch(e=>{
        console.log(e);
        res.sendStatus(400);
    })
})

router.get("/:chatId/messages", async (req, res, next)=>{
    Message.find({chat:req.params.chatId})
    .populate("sender")
    .then(results => res.status(200).send(results))
    .catch(e=>{
        console.log(e);
        res.sendStatus(400);
    })
})


module.exports = router;