const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../schemas/UserSchema');
const bcrypt = require('bcrypt');

app.set("view engine", "pug");      // template engine
app.set("views", "views");          // use folder called views for views

app.use(bodyParser.urlencoded({extended: false}))

// handles the route
router.get("/", (req, res, next)=>{
    res.status(200).render("register"); // render register.pug page
})

router.post("/", async(req, res, next)=>{

    var firstName = req.body.firstName.trim();
    var lastName = req.body.lastName.trim();
    var username = req.body.username.trim();
    var email = req.body.email.trim();
    var password = req.body.password;

    var payload = req.body;

    // check to see if all fields have values
    if(firstName && lastName && username && email && password){
        var user = await User.findOne({$or: [{username},{email}]})
        .catch((e)=>{
            console.log(e);
            payload.errorMessage = "Something went wrong";
            res.status(200).render("register", payload); 
        })

        if(user == null){
            // insert the user
            var data = req.body;

            // saltrounds will perform 2^10 times the hashing algorithm
            data.password = await bcrypt.hash(password, 10);
            
            User.create(data)
            .then((user)=>{
                req.session.user = user;
                return res.redirect("/");
            })
            .catch()

        }else{
            // user/email already exists
            if(email == user.email){
                payload.errorMessage = "Email already in use";
            }else{
                payload.errorMessage = "User already in use";
            }
            res.status(200).render("register", payload);
        }

    }else{
        payload.errorMessage = "Each field needs a valid value";
        res.status(200).render("register", payload); // render register.pug page and passback the payload data
    }

    
})

module.exports = router;