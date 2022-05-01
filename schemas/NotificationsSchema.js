const mongoose = require('mongoose');   // connects to the database

const Schema = mongoose.Schema;

const NotificationSchema = new Schema({

    userTo: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    userFrom: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    notificationType: String,
    opened: {
        type: Boolean,
        default: false
    },
    entityId: Schema.Types.ObjectId
    
}, {timestamps: true});

NotificationSchema.statics.insertNotification = async(userTo, userFrom, notificationType, entityId) =>{
    var data = {
        userTo,
        userFrom,
        notificationType,
        entityId
    };

    // remove notification if it exits
    await Notification.deleteOne(data).catch(e=>console.log(e));
    return Notification.create(data).catch(e=>console.log(e));
}

var Notification = mongoose.model('Notification', NotificationSchema);
module.exports = Notification;