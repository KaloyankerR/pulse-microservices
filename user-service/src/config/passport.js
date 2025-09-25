const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const prisma = require('./database');
const logger = require('../utils/logger');

// Configure Passport to use Google OAuth2 strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    logger.info('Google OAuth callback received', { 
      googleId: profile.id, 
      email: profile.emails[0]?.value 
    });

    // Check if user already exists with this Google ID
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { providerId: profile.id },
          { email: profile.emails[0]?.value },
        ],
      },
    });

    if (user) {
      // Update existing user with Google provider info if not already set
      if (!user.providerId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            provider: 'GOOGLE',
            providerId: profile.id,
            verified: true, // Google users are automatically verified
          },
        });
        logger.info('Updated existing user with Google provider', { userId: user.id });
      }
      return done(null, user);
    }

    // Create new user from Google profile
    const email = profile.emails[0]?.value;
    if (!email) {
      return done(new Error('No email provided by Google'), null);
    }

    // Generate a unique username from email
    const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    let username = baseUsername;
    let counter = 1;

    // Ensure username is unique
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    user = await prisma.user.create({
      data: {
        email,
        username,
        displayName: profile.displayName || profile.name?.givenName || email.split('@')[0],
        avatarUrl: profile.photos[0]?.value,
        provider: 'GOOGLE',
        providerId: profile.id,
        verified: true, // Google users are automatically verified
        status: 'ACTIVE',
      },
    });

    logger.info('Created new user from Google OAuth', { 
      userId: user.id, 
      email: user.email,
      username: user.username 
    });

    return done(null, user);
  } catch (error) {
    logger.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        verified: true,
        status: true,
        provider: true,
        providerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    done(null, user);
  } catch (error) {
    logger.error('Deserialize user error:', error);
    done(error, null);
  }
});

module.exports = passport;
