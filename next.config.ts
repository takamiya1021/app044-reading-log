import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import { execSync } from "child_process";

import packageJson from "./package.json";

// Gitタグからバージョンを取得
const getGitVersion = (): string => {
  try {
    const gitVersion = execSync("git describe --tags --always", { encoding: "utf-8" }).trim();
    // もしタグが見つからずハッシュ値（7文字以上の16進数）だけが返ってきた場合、
    // package.jsonのバージョンをベースにして表示
    if (/^[0-9a-f]{7,}$/.test(gitVersion)) {
      return `v${packageJson.version}-${gitVersion}`;
    }
    return gitVersion.startsWith("v") ? gitVersion : `v${gitVersion}`;
  } catch {
    return `v${packageJson.version}`;
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
