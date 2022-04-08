const mongoose = require('mongoose')

//mongoose.set('useFindAndModify', false);  // older versions caused deprecated warnings
//mongoose.set('useUnifiedTopology', true);


class Database{

    constructor(){
        this.connect();
    }

    connect(){
        mongoose.connect("mongodb+srv://brycehulett:Houston1@college-hub.0blzh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority")
        .then(()=>{
            console.log("database connection successful");
        })
        .catch((err)=>{
            console.log("database connection error" + err);
        })  
    }
}

module.exports = new Database();