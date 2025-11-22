if(process.env.NODE_ENV !="production"){
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const Review = require("./models/review.js");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const {isLoggedIn,isOwner,isReviewAuthor} = require("./views/middleware.js");
const listengController = require("./controllers/listings.js");
const reviewController = require("./controllers/reviews.js");
const multer = require("multer");
const {storage} = require("./cloudConfig.js");
const upload = multer({storage});

const userRouter = require("./routes/user.js");


app.set("views",path.join(__dirname,"views"));
app.set("view engine","ejs");
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const dbUrl = process.env.ATLASDB_URL;

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});

store.on("error", ()=>{
    console.log("ERROR in MONGO SESSION STORE", err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge:  7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};



app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

app.use("/",userRouter);

main().
    then(()=>{
        console.log("connected to db");
    })
.catch((err)=>{
    console.log(err);
});

async function main() {
    await mongoose.connect(dbUrl);
}

app.listen(3000,()=>{
    console.log("server is started");
});

// app.get("/",(req,res)=>{
//     res.send("working");
// });

//Index route
app.get("/listings",(listengController.index));


//New Route
app.get("/listings/new",isLoggedIn,(listengController.renderNewForm));

//Show route
app.get("/listings/:id",(listengController.showListings));

//Create Route
app
.post("/listings",isLoggedIn,upload.single("listing[image]"),(listengController.createListing));

//Edit Route
app.get("/listings/:id/edit",isLoggedIn,isOwner,(listengController.editListing));

//Update Route
app.put("/listings/:id/edit",isLoggedIn,isOwner,upload.single("listing[image]"),(listengController.updateListing));

//Delete Route
app.delete("/listings/:id",isLoggedIn,isOwner,(listengController.deleteListing));

//Review
// Post Review Route
app.post("/listings/:id/reviews", isLoggedIn,(reviewController.createReview));

//Delete Review Route
app.delete("/listings/:id/reviews/:reviewId",isLoggedIn,isReviewAuthor,(reviewController.deleteReview));


//Signup Route
app.get("/signup", (req,res) => {
    res.render("users/signup.ejs");
});

// app.get("/testListing",async(req,res)=>{
//    let sampleListing = new Listing({
//     title:"My new Villa",
//     description:"By the beach",
//     price:1200,
//     location:"Calangute,Goa",
//     contry:"India"
//    });
   
//    await sampleListing.save();
//    console.log("sampe was saved");
//    res.send("successful");
// });

app.get("/", (req, res) => {
    res.redirect("/listings");
});

app.use((err,req,res,next)=>{
     console.error(err.stack);  // Logs error details in console
    if (res.headersSent) {
        return next(err); // Prevents double response
    }
    res.status(500).render("error.ejs", { err });
});