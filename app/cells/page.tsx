import { prisma } from '@/lib/prisma'
import { CellCard } from '@/components/CellCard'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getCells() {
  return await prisma.cell.findMany({
    include: {
      _count: {
        select: {
          memberships: {
            where: { leftAt: null },
          },
          sessionRecords: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function CellsPage() {
  const cells = await getCells()

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Community Cells</h1>
            <p className="text-gray-600">
              Manage your micro-communities and sub-groups
            </p>
          </div>
          <Link
            href="/cells/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Cell
          </Link>
        </div>

        {cells.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500 mb-4">No cells yet</p>
            <Link
              href="/cells/new"
              className="text-blue-600 hover:underline"
            >
              Create your first cell
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cells.map(cell => (
              <CellCard key={cell.id} cell={cell} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
