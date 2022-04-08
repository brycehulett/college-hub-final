const mongoose = require('mongoose');   // connects to the database

const Schema = mongoose.Schema;

const PostSchema = new Schema({
    content: {
        type: String,
        trim: true
    },
    filePath: String,
    postedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    pinned: Boolean,
    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    retweetUsers: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    retweetData: {
        type: Schema.Types.ObjectId,
        ref: 'Post'
    },
    replyTo: {
        type: Schema.Types.ObjectId,
        ref: 'Post'
    }
    
}, {timestamps: true});

var Post = mongoose.model('Post', PostSchema);
module.exports = Post;