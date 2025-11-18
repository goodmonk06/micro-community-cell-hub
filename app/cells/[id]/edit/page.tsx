import { prisma } from '@/lib/prisma'
import { CellForm } from '@/components/CellForm'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

async function getCell(id: string) {
  const cell = await prisma.cell.findUnique({
    where: { id },
  })

  if (!cell) {
    notFound()
  }

  return cell
}

export default async function EditCellPage({
  params,
}: {
  params: { id: string }
}) {
  const cell = await getCell(params.id)

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href={`/cells/${cell.id}`}
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← Back to Cell
        </Link>

        <h1 className="text-4xl font-bold mb-8">Edit Cell</h1>

        <CellForm mode="edit" initialData={cell} />
      </div>
    </div>
  )
}
