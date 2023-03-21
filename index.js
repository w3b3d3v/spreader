require("dotenv").config()
const { saveUserToken } = require("./db")

const express = require("express")
const passport = require("passport")
const session = require("express-session")
const LinkedInStrategy = require("passport-linkedin-oauth2").Strategy

const app = express()
app.set("view engine", "ejs")
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
)


app.use(passport.initialize())
app.use(passport.session())

passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: "http://127.0.0.1:3000/auth/linkedin/callback",
      scope: ["r_emailaddress", "r_liteprofile", "w_member_social"],
    },
    async function (accessToken, refreshToken, profile, done) {
      console.log(profile)
      console.log("Access Token:", accessToken)
      try {
        const expiresIn = 60 * 60 * 24 * 60 // 60 days in seconds
        const user = {
          id: profile.id,
          accessToken,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          email: profile.emails[0].value,
          profileUrl: profile._json.publicProfileUrl,
          expiresIn,
        }
        await saveUserToken(user)
        return done(null, user)
      } catch (err) {
        return done(err)
      }
    }
  )
)

passport.serializeUser((user, done) => {
  done(null, user)
})

passport.deserializeUser((user, done) => {
  done(null, user)
})

app.get("/", (req, res) => {
  res.render("index")
})

app.get(
  "/auth/linkedin",
  passport.authenticate("linkedin", { state: "SOME STATE" }),
  function (req, res) {
    // The request will be redirected to LinkedIn for authentication, so this
    // function will not be called.
  }
)

app.get(
  "/auth/linkedin/callback",
  passport.authenticate("linkedin", {
    successRedirect: "/",
    failureRedirect: "/",
  }),
  (req, res) => {
    res.redirect("/profile")
  }
)

app.get("/profile", (req, res) => {
  res.render("profile", { user: req.user })
})

app.listen(3000, () => {
  console.log("App is running on port 3000")
})

