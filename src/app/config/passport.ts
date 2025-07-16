/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";
import { envVars } from "./env";
import { User } from "../modules/user/user.model";
import { Role } from "../modules/user/user.interface";
import { Strategy as LocalStrategy } from "passport-local";
import bcryptjs from "bcryptjs";

// Passport configuration for Local Authentication Strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email: string, password: string, done) => {
      // Implement your user verification logic here
      try {
        const isUserExist = await User.findOne({ email });
        if (!isUserExist) {
          return done(null, false, {
            message: "User does not exist!",
          });
        }

        // if (!isUserExist) {
        //   return done("User does not exist!");
        // }

        const isGoogleAuthenticated = isUserExist.auths.some(
          (providerObjs) => providerObjs.provider === "google"
        );

        if (isGoogleAuthenticated && !isUserExist.password) {
          return done(null, false, {
            message:
              "Please login with Google! You have registered with Google login. If you want to login with email and password, please at first login with Google and set a password for your Gmail.",
          });
        }
        // if (isGoogleAuthenticated) {
        //   return done(
        //     "Please login with Google! You have registered with Google login. If you want to login with email and password, please at first login with Google and set a password for your Gmail."
        //   );
        // }

        const isPasswordMatched = await bcryptjs.compare(
          password as string,
          isUserExist.password as string
        );
        if (!isPasswordMatched) {
          return done(null, false, {
            message: "Password does not match!",
          });
        }

        return done(null, isUserExist);
      } catch (error) {
        console.error("Error during local authentication:", error);
        return done(error);
      }
    }
  )
);

passport.use(
  new GoogleStrategy(
    {
      clientID: envVars.GOOGLE_CLIENT_ID,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET,
      callbackURL: envVars.GOOGLE_CALLBACK_URL,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) {
          return done(null, false, {
            message: "No email found in Google profile",
          });
        }

        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            email,
            name: profile?.displayName,
            picture: profile?.photos?.[0]?.value,
            role: Role.USER,
            isVerified: true,
            auths: [
              {
                provider: "google",
                providerId: profile.id,
              },
            ],
          });
        }

        return done(null, user);
      } catch (error) {
        console.error("Error during Google authentication:", error);
        return done(error);
      }
    }
  )
);

// Frontend http://localhost:5173 => Backend http://localhost:5000/api/v1/auth/google  => Passportjs => Google OAuth Consent => gmail login => success => redirect to http://localhost:5173/auth/google/callback

// Serialize and deserialize user for session management >>>>
passport.serializeUser((user: any, done: (err: any, id?: unknown) => void) => {
  done(null, user._id);
});

passport.deserializeUser(
  async (id: string, done: (err: any, user?: any) => void) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      console.log(error);
      done(error);
    }
  }
);
