const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const User = require('../schemas/UserSchema');

app.set("view engine", "pug");      // template engine
app.set("views", "views");          // use folder called views for views

app.use(bodyParser.urlencoded({extended: false}))

// handles the route
router.get("/", (req, res, next)=>{
    res.status(200).render("login"); // render login.pug page
})
router.post("/", async(req, res, next)=>{

    var payload = req.body;

    if(req.body.logUsername && req.body.logPassword){
        var user = await User.findOne({
            $or: [
                {username: req.body.logUsername},
                {email: req.body.logUsername}
            ]
        })
        .catch((e)=>{
            console.log(e);
            payload.errorMessage = "Something went wrong";
            res.status(200).render("login", payload); 
        })
        if(user != null){
            var result = await bcrypt.compare(req.body.logPassword, user.password);
            if(result === true){
                req.session.user = user;
                return res.redirect("/");
            }
        }
        payload.errorMessage = "Login Credentials Incorrect";
        return res.status(200).render("login", payload); 
    }
    payload.errorMessage = "Each field needs a valid value";
    res.status(200).render("login"); // render login.pug page
})

module.exports = router;