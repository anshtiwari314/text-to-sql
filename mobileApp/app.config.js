const app = require("./app.json");

const iosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME || "com.googleusercontent.apps.sqlai";

/** Native Google and GitHub modules. Expo Go cannot load them; use a dev build. */
module.exports = () => ({
  expo: {
    ...app.expo,
    plugins: [
      ...app.expo.plugins,
      ["@react-native-google-signin/google-signin", { iosUrlScheme }],
      ["react-native-app-auth", { redirectUrls: ["sqlai://oauth/github"] }],
    ],
  },
});
