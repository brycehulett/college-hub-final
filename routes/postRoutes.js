const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const User = require('../schemas/UserSchema');


// handles the route
router.get("/:id", (req, res, next)=>{

    // create some payload
    var payload = {
        pageTitle: "View Posts",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user),
        postId: req.params.id
    }

    res.status(200).render("postPage", payload); // render postPage.pug page
})


module.exports = router;