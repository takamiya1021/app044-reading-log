import BookList from "@/components/BookList";
import DataManagement from "@/components/DataManagement";
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
          <Link
            href="/books/new"
            className="px-4 py-2 bg-amber-800/80 hover:bg-amber-700 text-amber-50 border border-amber-600 rounded-md transition-all"
          >
            + 本を追加
          </Link>
        </div>

        {/* データ管理 */}
        <div className="pt-4 border-t border-white/10">
          <DataManagement />
        </div>
      </header>

      <BookList />
    </div>
  );
}
