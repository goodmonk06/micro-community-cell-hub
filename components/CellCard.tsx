import Link from 'next/link'

type CellCardProps = {
  cell: {
    id: string
    key: string
    name: string
    descriptionMarkdown?: string | null
    themeTagsJson?: string | null
    _count?: {
      memberships: number
      sessionRecords: number
    }
  }
}

export function CellCard({ cell }: CellCardProps) {
  const themeTags = cell.themeTagsJson ? JSON.parse(cell.themeTagsJson) : []

  return (
    <Link
      href={`/cells/${cell.id}`}
      className="block border border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition-all"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-semibold">{cell.name}</h3>
        <span className="text-sm text-gray-500">@{cell.key}</span>
      </div>

      {cell.descriptionMarkdown && (
        <p className="text-gray-700 mb-4 line-clamp-2">
          {cell.descriptionMarkdown}
        </p>
      )}

      {themeTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {themeTags.map((tag: string, idx: number) => (
            <span
              key={idx}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {cell._count && (
        <div className="flex gap-4 text-sm text-gray-600">
          <span>{cell._count.memberships} members</span>
          <span>{cell._count.sessionRecords} sessions</span>
        </div>
      )}
    </Link>
  )
}
