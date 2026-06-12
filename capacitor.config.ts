import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.hocker.one",
  appName: "Hocker ONE",
  webDir: "mobile-shell",
  backgroundColor: "#020617",
  loggingBehavior: "production",
  server: {
    url: "https://hockerone.vercel.app",
    cleartext: false,
    androidScheme: "https"
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};

export default config;
