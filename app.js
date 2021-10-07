//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true
});
mongoose.set("useCreateIndex", true);




const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  event: String
});



userSchema.plugin(passportLocalMongoose);


const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});




// Handling get requests

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});




//Event page rendering

app.get("/event", function (req, res) {
  User.find({
    "event": {
      $ne: null
    }
  }, function (err, foundUsers) {
    if (err) {
      console.log(err);
    } else {
      if (foundUsers) {

        res.render("event", {
          usersWithSecrets: foundUsers,
        });
      }
    }
  });
});

app.get("/createevent", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("createevent");
  } else {
    res.redirect("/login");
  }
});

// creating an event

app.post("/createevent", function (req, res) {
  const submittedevent = req.body.event;

  //Once the user is authenticated and their session gets saved, their user details are saved to req.user.
  // console.log(req.user.id);

  User.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.event = submittedevent;
        foundUser.save(function () {
          res.redirect("/event");
        });
      }
    }
  });
});
//logging out 
app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

// register page post request handling

app.post("/register", function (req, res) {

  User.register({
    username: req.body.username
  }, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/event");
      });
    }
  });

});

// login page post request handling

app.post("/login", function (req, res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/event");
      });
    }
  });

});

// Changing the password

app.get("/changepassword", function (req, res) {
  res.render("changepassword");
});
app.post("/changepassword", function (req, res) {
  if (req.isAuthenticated()) {
    User.findById((req.body.username).id, function (err, foundUser) {
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          foundUser.password = req.body.oldpassword;
          passport.authenticate("local")(req, res, function () {
            foundUser.password = req.body.newpassword;
            foundUser.save(function () {
              res.write("changed");
              res.redirect("/event");
            });
          });
        }
      }
    });
  }
});

//Invite people 
app.get("/invitepeople", function (req, res) {

  res.render("invitepeople");;

});

//status of the event function

function status(dateoftheevent) {
  var d = new Date();
  var currentDate = d.getDate();
  if (currentdate == dateoftheevent) {
    var status = "EventOngoing";
  } else if (currentdate > dateoftheevent) {
    var status = "EventCompleted";
  } else {
    var status = "EventUpcoming";
  }
}
app.post("/invitepeople", function (req, res) {
  var inviteduser = req.body.name;
  var dateoftheevent = req.body.date;
});




app.listen(3000, function () {
  console.log("Server started on port 3000.");
});