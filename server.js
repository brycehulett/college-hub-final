// for testing purposes only

require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;
const middleware = require('./middleware');
const path = require('path')
const bodyParser = require('body-parser');
const session = require('express-session');

// const MongoClient = require('mongodb').MongoClient;
// const url = 'mongodb://127.0.0.1:27017';
// const dbName = 'college-hub-test'
// let db

// MongoClient.connect(url, { useNewUrlParser: true }, (err, client) => {
//   if (err) return console.log(err)

//   // Storing a reference to the database so you can use it later
//   db = client.db(dbName)
//   console.log(`Connected MongoDB: ${url}`)
//   console.log(`Database: ${dbName}`)
// })



app.set("view engine", "pug");      // template engine
app.set("views", "views");          // use folder called views for views

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, "public"))); // full path to directory name -> uses the public folder for static css files

// hashes a session using this secret
app.use(session({
    secret: "roti canai",
    resave: true,
    saveUninitialized: false
}));


// Routes
const loginRoute = require('./routes/loginRoutes');
const registerRoute = require('./routes/registerRoutes');
const logoutRoute = require('./routes/logoutRoutes');
const postRoute = require('./routes/postRoutes');
const profileRoute = require('./routes/profileRoutes');
const uploadRoute = require('./routes/uploadRoutes');
const searchRoute = require('./routes/searchRoutes');
const messagesRoute = require('./routes/messagesRoutes');
const filesRoute = require('./routes/filesRoutes');
const notificationsRoute = require('./routes/notificationsRoutes');

// API Routes
const postApiRoute = require('./routes/api/posts');
const usersApiRoute = require('./routes/api/users');
const chatsApiRoute = require('./routes/api/chats');
const messagesApiRoute = require('./routes/api/messages');
const notificationsApiRoute = require('./routes/api/notifications');

// Routes
app.use("/login", loginRoute);
app.use("/register", registerRoute);
app.use("/logout", logoutRoute);
app.use("/posts", middleware.requireLogin, postRoute);
app.use("/profile", middleware.requireLogin, profileRoute);
app.use("/uploads", uploadRoute);
app.use("/search", middleware.requireLogin, searchRoute);
app.use("/messages", middleware.requireLogin, messagesRoute);
app.use("/files", filesRoute);
app.use("/notifications", middleware.requireLogin, notificationsRoute);

// API Routes
app.use("/api/posts", postApiRoute);
app.use("/api/users", usersApiRoute);
app.use("/api/chats", chatsApiRoute);
app.use("/api/messages", messagesApiRoute);
app.use("/api/notifications", notificationsApiRoute);

// when the root of the site is accessed, first check if user is logged in
app.get("/", (req, res, next)=>{

    // create some payload
    var payload = {
        pageTitle: "Home: College Hub",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user)
    }

    res.status(200).render("home", payload); // render home.pug as view passing payload
})

module.exports = app;