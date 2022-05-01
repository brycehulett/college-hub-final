const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../../schemas/UserSchema');
const Post = require('../../schemas/PostSchema');
const Notification = require('../../schemas/NotificationsSchema');
const path = require('path');
const uuid = require('uuid').v4;

const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, 'files');
    },
    filename: async (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filePath = `/files/${file.originalname}`;
        var postData = {
            content: 'file upload',
            filePath,
            postedBy: req.session.user
        }

        await Post.create(postData)
        .then(async newPost=>{
            newPost = await User.populate(newPost, {path: "postedBy"});
            cb(null, `/${file.originalname}`);
        })
        
    }
 });
//  const storage = multer.diskStorage({
//     destination: (req, file, cb) =>{
//         cb(null, 'uploads/files');
//     },
//     filename: (req, file, cb) => {
//         const {originalname} = file;
//         cb(null, originalname);
//     }
//  });
 const upload = multer({storage});

app.use(bodyParser.urlencoded({extended: false}))

// handles the route
router.get("/", async(req, res, next)=>{

    var searchObj = req.query;
    if(searchObj.isReply !== undefined){
        var isReply = searchObj.isReply == "true";
        searchObj.replyTo = {$exists: isReply};
        delete searchObj.isReply;
    }

    if(searchObj.search !== undefined){
        searchObj.content = {$regex: searchObj.search, $options:"i"};
        delete searchObj.search;

    }

    if(searchObj.followingOnly !== undefined){
        var followingOnly = searchObj.followingOnly == "true";
        if(followingOnly){
            var objectIds = [];

            if(!req.session.user.following){
                req.session.user.following = [];
            }
            req.session.user.following.forEach(user =>{
                objectIds.push(user);
            })

            objectIds.push(req.session.user._id);   // adds your own posts
            searchObj.postedBy = {$in: objectIds};
        }
        
        delete searchObj.followingOnly;
    }

    var results = await getPosts(searchObj);
    return res.status(200).send(results);
})

router.get("/:id", async(req, res, next)=>{
    var postId = req.params.id;
    var postData = await getPosts({_id: postId});
    postData = postData[0];

    var results = {
        postData
    }
    if(postData.replyTo !== undefined) results.replyTo = postData.replyTo;
    
    results.replies = await getPosts({replyTo:postId});

    return res.status(200).send(results);
 })

router.post("/", async(req, res, next)=>{

    if(!req.body.content){
        console.log("Content param not sent w/ request");
        return res.sendStatus(400);
    }

    var postData = {
        content: req.body.content,
        postedBy: req.session.user
    }

    if(req.body.replyTo){
        postData.replyTo = req.body.replyTo;
    }

    Post.create(postData)
    .then(async newPost=>{
        newPost = await User.populate(newPost, {path: "postedBy"});
        newPost = await Post.populate(newPost, {path: "replyTo"});

        if(newPost.replyTo !== undefined){
            await Notification.insertNotification(newPost.replyTo.postedBy, req.session.user._id, "reply", newPost._id);
        }

        res.status(201).send(newPost);
    })
    .catch(e=>{
        console.log(e);
        res.sendStatus(400);
    })
    
})

router.post("/files", upload.array('avatar'), async(req, res, next)=>{
    return res.json({status:'ok', uploaded: req.files.length});
});

router.put("/:id/like", async(req, res, next)=>{

    var postId = req.params.id;
    var userId = req.session.user._id;

    var isLiked = req.session.user.likes && req.session.user.likes.includes(postId);

    var option = isLiked ? "$pull" : "$addToSet";

    // update both arrays user likes and post likes

    req.session.user = await User.findByIdAndUpdate(userId, {[option]: {likes:postId}}, {new:true})
    .catch(e=>{
        console.log(e);
        res.sendStatus(400);
    })

    var post = await Post.findByIdAndUpdate(postId, {[option]: {likes:userId}}, {new:true})
    .catch(e=>{
        console.log(e);
        res.sendStatus(400);
    })

    if(!isLiked){
        await Notification.insertNotification(post.postedBy, userId, "postLike", post._id);
    }

    res.status(200).send(post);
})

router.post("/:id/retweet", async(req, res, next)=>{

    //return res.status(200).send("yeehaw");
    var postId = req.params.id;
    var userId = req.session.user._id;

    var deletedPost = await Post.findOneAndDelete({postedBy: userId, retweetData: postId})
    .catch(e=>{
        console.log(e);
        res.sendStatus(400);
    })

    var option = deletedPost != null ? "$pull" : "$addToSet";

    var repost = deletedPost;
    if(repost == null){
        repost = await Post.create({postedBy:userId, retweetData: postId})
        .catch(e=>{
            console.log(e);
            res.sendStatus(400);
        })
    }

    req.session.user = await User.findByIdAndUpdate(userId, {[option]: {retweets:repost._id}}, {new:true})
    .catch(e=>{
        console.log(e);
        res.sendStatus(400);
    })

    var post = await Post.findByIdAndUpdate(postId, {[option]: {retweetUsers:userId}}, {new:true})
    .catch(e=>{
        console.log(e);
        res.sendStatus(400);
    })

    if(!deletedPost){
        await Notification.insertNotification(post.postedBy, userId, "retweet", post._id);
    }

    res.status(200).send(post);
})

router.delete("/:id", (req, res, next)=>{
    Post.findByIdAndDelete(req.params.id)
    .then(() => res.sendStatus(202))
    .catch(e => {
        console.log(e);
        res.sendStatus(400);
    })
})

router.put("/:id", async (req, res, next)=>{

    if(req.body.pinned !== undefined){
        await Post.updateMany({postedBy: req.session.user}, {pinned: false})
        .catch(e => {
            console.log(e);
            res.sendStatus(400);
        })
    }

    Post.findByIdAndUpdate(req.params.id, req.body)
    .then(() => res.sendStatus(204))
    .catch(e => {
        console.log(e);
        res.sendStatus(400);
    })
})

async function getPosts(filter){
    var results = await Post.find(filter)
    .populate("postedBy")
    .populate("retweetData")
    .populate("replyTo")
    .sort({"createdAt":-1})
    .catch(e=>console.log(e))

    results = await User.populate(results, {path: "replyTo.postedBy"})
    return await User.populate(results, {path: "retweetData.postedBy"});
}

module.exports = router;