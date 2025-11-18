'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type CellFormProps = {
  mode: 'create' | 'edit'
  initialData?: {
    id?: string
    communityId?: string
    key?: string
    name?: string
    descriptionMarkdown?: string | null
    themeTagsJson?: string | null
  }
}

export function CellForm({ mode, initialData }: CellFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const themeTags = initialData?.themeTagsJson
    ? JSON.parse(initialData.themeTagsJson)
    : []

  const [formData, setFormData] = useState({
    communityId: initialData?.communityId || '',
    key: initialData?.key || '',
    name: initialData?.name || '',
    descriptionMarkdown: initialData?.descriptionMarkdown || '',
    themeTags: themeTags.join(', '),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const tags = formData.themeTags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)

      const payload = {
        communityId: formData.communityId,
        key: formData.key,
        name: formData.name,
        descriptionMarkdown: formData.descriptionMarkdown,
        themeTagsJson: JSON.stringify(tags),
      }

      const url = mode === 'create'
        ? '/api/cells'
        : `/api/cells/${initialData?.id}`

      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save cell')
      }

      const { cell } = await response.json()
      router.push(`/cells/${cell.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="communityId" className="block text-sm font-medium mb-2">
          Community ID *
        </label>
        <input
          id="communityId"
          type="text"
          required
          disabled={mode === 'edit'}
          value={formData.communityId}
          onChange={e => setFormData({ ...formData, communityId: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        />
      </div>

      <div>
        <label htmlFor="key" className="block text-sm font-medium mb-2">
          Key (URL slug) *
        </label>
        <input
          id="key"
          type="text"
          required
          disabled={mode === 'edit'}
          pattern="[a-z0-9-]+"
          value={formData.key}
          onChange={e => setFormData({ ...formData, key: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          placeholder="e.g., web-dev-study"
        />
        <p className="text-sm text-gray-500 mt-1">
          Lowercase alphanumeric with hyphens only
        </p>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Name *
        </label>
        <input
          id="name"
          type="text"
          required
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Web Development Study Group"
        />
      </div>

      <div>
        <label
          htmlFor="descriptionMarkdown"
          className="block text-sm font-medium mb-2"
        >
          Description
        </label>
        <textarea
          id="descriptionMarkdown"
          rows={4}
          value={formData.descriptionMarkdown}
          onChange={e =>
            setFormData({ ...formData, descriptionMarkdown: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Describe the purpose and focus of this cell..."
        />
      </div>

      <div>
        <label htmlFor="themeTags" className="block text-sm font-medium mb-2">
          Theme Tags
        </label>
        <input
          id="themeTags"
          type="text"
          value={formData.themeTags}
          onChange={e => setFormData({ ...formData, themeTags: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., javascript, react, frontend"
        />
        <p className="text-sm text-gray-500 mt-1">
          Comma-separated tags
        </p>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Saving...' : mode === 'create' ? 'Create Cell' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
