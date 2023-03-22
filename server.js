require("dotenv").config()
const { saveUserToken, pool } = require("./db")

const express = require("express")
const passport = require("passport")
const session = require("express-session")
const LinkedInStrategy = require("passport-linkedin-oauth2").Strategy
const axios = require("axios")
const bodyParser = require("body-parser")

const app = express()
app.set("view engine", "ejs")
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
)
app.use(bodyParser.urlencoded({ extended: false }))

app.use(passport.initialize())
app.use(passport.session())

passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: process.env.LINKEDIN_CALLBACK_URL,
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

app.get("/post", (req, res) => {
  res.render("post")
})

// Handle form submission
app.post("/submit", async (req, res) => {
  // Read the submitted message
  const message = req.body.message

  try {
    // Fetch all authorized users from the database
    const [rows] = await pool.query("SELECT * FROM linkedin_users")

    // Post the message on LinkedIn for each authorized user
    for (const user of rows) {
      console.log(user)
      await axios.post(
        "https://api.linkedin.com/v2/shares",
        {
          owner: `urn:li:person:${user.id}`,
          text: {
            text: message,
          },
          content: {
            shareMediaCategory: "NONE",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${user.access_token}`,
            "Content-Type": "application/json",
          },
        }
      )
    }

    res.send("Posted the message on LinkedIn for all authorized users.")
  } catch (error) {
    console.error(error)
    res.status(500).send("An error occurred while posting the message.")
  }
})


const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
