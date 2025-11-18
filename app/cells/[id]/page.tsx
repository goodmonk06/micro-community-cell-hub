import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

async function getCell(id: string) {
  const cell = await prisma.cell.findUnique({
    where: { id },
    include: {
      memberships: {
        where: { leftAt: null },
        orderBy: { joinedAt: 'desc' },
      },
      sessionRecords: {
        orderBy: { ts: 'desc' },
        take: 10,
      },
      _count: {
        select: {
          memberships: {
            where: { leftAt: null },
          },
          sessionRecords: true,
        },
      },
    },
  })

  if (!cell) {
    notFound()
  }

  return cell
}

async function getCellStats(id: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/stats/cells/${id}`,
    { cache: 'no-store' }
  )

  if (!response.ok) {
    return null
  }

  return response.json()
}

export default async function CellDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const cell = await getCell(params.id)
  const stats = await getCellStats(params.id)
  const themeTags = cell.themeTagsJson ? JSON.parse(cell.themeTagsJson) : []

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/cells"
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← Back to Cells
        </Link>

        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{cell.name}</h1>
              <p className="text-gray-600">@{cell.key}</p>
            </div>
            <Link
              href={`/cells/${cell.id}/edit`}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Edit
            </Link>
          </div>

          {themeTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {themeTags.map((tag: string, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {cell.descriptionMarkdown && (
            <div className="prose max-w-none">
              <p>{cell.descriptionMarkdown}</p>
            </div>
          )}
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <div className="border border-gray-300 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Members</p>
              <p className="text-3xl font-bold">{stats.memberStats.total}</p>
            </div>
            <div className="border border-gray-300 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total Sessions</p>
              <p className="text-3xl font-bold">{stats.sessionStats.total}</p>
            </div>
            <div className="border border-gray-300 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Avg Attendance</p>
              <p className="text-3xl font-bold">
                {stats.sessionStats.averageAttendance}
              </p>
            </div>
            <div className="border border-gray-300 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Health</p>
              <p className="text-3xl font-bold capitalize">
                {stats.health.status}
              </p>
            </div>
          </div>
        )}

        {/* Members Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Members ({cell._count.memberships})</h2>
            <Link
              href={`/cells/${cell.id}/members/add`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Member
            </Link>
          </div>

          {cell.memberships.length === 0 ? (
            <p className="text-gray-500">No members yet</p>
          ) : (
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Member ID</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {cell.memberships.map(membership => (
                    <tr key={membership.id} className="border-t border-gray-200">
                      <td className="px-4 py-3">{membership.memberId}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            membership.role === 'HOST'
                              ? 'bg-purple-100 text-purple-800'
                              : membership.role === 'COHOST'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {membership.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {new Date(membership.joinedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              Recent Sessions ({cell._count.sessionRecords})
            </h2>
            <Link
              href={`/cells/${cell.id}/sessions/new`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Log Session
            </Link>
          </div>

          {cell.sessionRecords.length === 0 ? (
            <p className="text-gray-500">No sessions yet</p>
          ) : (
            <div className="space-y-4">
              {cell.sessionRecords.map(session => (
                <div
                  key={session.id}
                  className="border border-gray-300 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          session.sessionType === 'CIRCLE'
                            ? 'bg-green-100 text-green-800'
                            : session.sessionType === 'STUDY'
                            ? 'bg-yellow-100 text-yellow-800'
                            : session.sessionType === 'PROJECT'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {session.sessionType}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {new Date(session.ts).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Attendance: {session.attendanceCount}
                  </p>
                  {session.notesMarkdown && (
                    <p className="text-sm">{session.notesMarkdown}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
