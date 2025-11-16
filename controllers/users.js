const User = require("../models/user");

module.exports.renderSignupFrom =  (req,res) => {
   
    res.render("users/signup.ejs");
};

module.exports.signup =  async(req,res) =>{
    try{
    let {username, email, password} = req.body;
    const newUser = new User({email,username});
    const registerUser = await User.register(newUser,password);
    console.log(registerUser);
    req.login(registerUser,(err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","Welcome to Wanderlust!");
        res.redirect("/listings");
    });
    } catch(e) {
        req.flash("error", e.message);
        res.redirect("/signup");
        
    }
   
};

module.exports.renderLoginFrom =  (req,res) => {
    res.render("users/login.ejs");
};

module.exports.login = async(req,res) => {
    req.flash("success","Welcome back to Wanderlust!");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    if (redirectUrl.includes("/reviews/")) {
        const listingId = redirectUrl.split("/")[2]; // extract the listing ID
        redirectUrl = `/listings/${listingId}`;
    }
    delete req.session.returnTo;
    res.redirect(redirectUrl);
};

module.exports.logout =  (req,res,next) => {
    req.logout((err) => {
        if(err) {
            return next(err);
        }
        req.flash("success","You are successfully logged out!");
        res.redirect("/listings");
    });
};