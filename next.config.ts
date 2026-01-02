import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import { execSync } from "child_process";

// Gitタグからバージョンを取得
const getGitVersion = (): string => {
  try {
    // git describe --tags --always でタグを取得
    return execSync("git describe --tags --always", { encoding: "utf-8" }).trim();
  } catch {
    return "v0.0.0";
  }
};

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
  turbopack: {},  // Turbopack設定（警告抑制）
  env: {
    NEXT_PUBLIC_APP_VERSION: getGitVersion(),
  },
};

export default withPWA(nextConfig);
