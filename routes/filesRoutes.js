const express = require('express');
const app = express();
const router = express.Router();
const path = require("path");


// handles the routes
router.get("/:name", (req, res, next)=>{
    var checkPath = path.join(__dirname, "../files/" + req.params.name);
    res.sendFile(checkPath);
})

module.exports = router;