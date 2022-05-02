const mongoose = require('mongoose')

//mongoose.set('useFindAndModify', false);  // older versions caused deprecated warnings
//mongoose.set('useUnifiedTopology', true);

class Database{

    constructor(){
        this.connect();
    }

    connect(){
        mongoose.connect(process.env.MONGODB_URL,{
            useUnifiedTopology: true,
            useNewUrlParser: true
        })
        .then(()=>{
            console.log("database connection successful");
        })
        .catch((err)=>{
            console.log("database connection error" + err);
        })  
    }
}

module.exports = new Database();