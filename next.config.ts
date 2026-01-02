import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: false,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: false,  // ユーザー操作で更新するためfalse
    clientsClaim: true,
    cleanupOutdatedCaches: true,
    importScripts: ["/sw-skip-waiting.js"],  // SKIP_WAITINGメッセージリスナー
  },
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withPWA(nextConfig);
