import { CellForm } from '@/components/CellForm'
import Link from 'next/link'

export default function NewCellPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/cells"
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← Back to Cells
        </Link>

        <h1 className="text-4xl font-bold mb-8">Create New Cell</h1>

        <CellForm mode="create" />
      </div>
    </div>
  )
}
