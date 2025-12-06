import BookList from "@/components/BookList";
import SettingsMenu from "@/components/SettingsMenu";
import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      <header className="glass-panel p-6 rounded-lg space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-serif text-amber-100">読書ログ</h1>
            <p className="text-gray-300">あなたのための読書記録</p>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/books/new"
              className="px-4 py-2 bg-amber-800/80 hover:bg-amber-700 text-amber-50 border border-amber-600 rounded-md transition-all"
            >
              + 本を追加
            </Link>
            <SettingsMenu />
          </div>
        </div>
      </header>

      <BookList />
    </div>
  );
}
