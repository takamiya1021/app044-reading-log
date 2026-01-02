import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import { execSync } from "child_process";

import packageJson from "./package.json";

// Gitタグからバージョンを取得
const getGitVersion = (): string => {
  try {
    const gitVersion = execSync("git describe --tags --always", { encoding: "utf-8" }).trim();
    // タグが見つからずハッシュ値のみ（7文字以上の16進数）の場合はpackage.jsonのバージョンを併記
    if (/^[0-9a-f]{7,}$/.test(gitVersion)) {
      return `v${packageJson.version}-${gitVersion}`;
    }
    return gitVersion;
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
