const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('./models/User');

module.exports = (passport) => {
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));

  // Google OAuth
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://bloghouse.space/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ providerId: profile.id });
      if (!user) {
        user = new User({
          provider: 'google',
          providerId: profile.id,
          displayName: profile.displayName,
          email: profile.emails[0].value,
          avatar: profile.photos[0].value
        });
        await user.save();
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  // GitHub OAuth
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "https://bloghouse.space/auth/github/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ providerId: profile.id });
      if (!user) {
        user = new User({
          provider: 'github',
          providerId: profile.id,
          displayName: profile.displayName,
          email: profile._json.email,
          avatar: profile.photos[0].value
        });
        await user.save();
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));
};
