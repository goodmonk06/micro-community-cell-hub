import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Micro Community Cell Hub</h1>
        <p className="text-lg mb-8">
          Manage your community cells, memberships, and sessions
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/cells"
            className="border border-gray-300 rounded-lg p-6 hover:border-gray-500 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Cells →</h2>
            <p>Browse and manage community cells</p>
          </Link>

          <Link
            href="/api/health"
            className="border border-gray-300 rounded-lg p-6 hover:border-gray-500 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">API Health →</h2>
            <p>Check API status</p>
          </Link>
        </div>
      </main>
    </div>
  )
}
