import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mobpae.app",
  appName: "MobPae",
  webDir: "dist",
  server: {
    // DEV ONLY — loads app from Vite dev server (API proxied, no CORS issues).
    // Comment out before production build.
    url: "http://192.168.1.4:5176",
    cleartext: true,
  },
  android: {
    // Edge-to-edge so safe-area-inset-bottom works in CSS
    // edgeToEdge: true, // Removed this line
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
