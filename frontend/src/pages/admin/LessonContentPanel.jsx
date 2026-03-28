import { useState } from 'react'
import { Layers, Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Button from '../../components/ui/Button'

// ─────────────────────────────────────────────────────────────────────────────
// LessonContentPanel
// Inline panel that opens beneath a lesson row to manage its content blocks.
// Props:
//   lesson    – the lesson object (must include .id and .contents)
//   onRefresh – callback to tell parent to re-fetch course data
// ─────────────────────────────────────────────────────────────────────────────

const CONTENT_TYPE_META = {
  text:  { label: 'Text',  color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200' },
  code:  { label: 'Code',  color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  video: { label: 'Video', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  image: { label: 'Image', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  file:  { label: 'File',  color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
}

const EMPTY_BLOCK = { type: 'text', body: '', url: '', language: '', file_name: '' }

function LessonContentPanel({ lesson, onRefresh }) {
  const [blocks, setBlocks] = useState(lesson.contents || [])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingBlock, setEditingBlock] = useState(null)
  const [newBlock, setNewBlock] = useState({ ...EMPTY_BLOCK })
  const [isSaving, setIsSaving] = useState(false)

  const authToken = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('auth-storage') || '{}')
      return stored?.state?.token || ''
    } catch { return '' }
  }

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken()}`,
  })

  const reload = async () => {
    try {
      const r = await fetch(
        `http://localhost:5000/api/admin/lessons/${lesson.id}/contents`,
        { headers: authHeaders() }
      )
      if (r.ok) {
        const data = await r.json()
        setBlocks(data.contents || [])
        onRefresh()
      }
    } catch {}
  }

  const handleAdd = async () => {
    if (!newBlock.body && !newBlock.url) {
      toast.error('Provide body text or a URL')
      return
    }
    setIsSaving(true)
    try {
      const r = await fetch(
        `http://localhost:5000/api/admin/lessons/${lesson.id}/contents`,
        {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            type: newBlock.type,
            body: newBlock.body || null,
            url: newBlock.url || null,
            language: newBlock.language || null,
            file_name: newBlock.file_name || null,
          }),
        }
      )
      if (r.ok) {
        toast.success('Content block added')
        setNewBlock({ ...EMPTY_BLOCK })
        setShowAddForm(false)
        await reload()
      } else {
        toast.error('Failed to add block')
      }
    } finally { setIsSaving(false) }
  }

  const handleUpdate = async (block) => {
    setIsSaving(true)
    try {
      const r = await fetch(
        `http://localhost:5000/api/admin/lesson-contents/${block.id}`,
        {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({
            type: block.type,
            body: block.body || null,
            url: block.url || null,
            language: block.language || null,
            file_name: block.file_name || null,
          }),
        }
      )
      if (r.ok) {
        toast.success('Block updated')
        setEditingBlock(null)
        await reload()
      } else { toast.error('Failed to update block') }
    } finally { setIsSaving(false) }
  }

  const handleDelete = async (blockId) => {
    if (!confirm('Delete this content block?')) return
    try {
      const r = await fetch(
        `http://localhost:5000/api/admin/lesson-contents/${blockId}`,
        { method: 'DELETE', headers: authHeaders() }
      )
      if (r.ok) {
        toast.success('Block deleted')
        await reload()
      } else { toast.error('Failed to delete block') }
    } catch {}
  }

  function BlockForm({ value, onChange, onSave, onCancel, label }) {
    return (
      <div className="space-y-3 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
            <select
              value={value.type}
              onChange={e => onChange({ ...value, type: e.target.value })}
              className="input-modern text-sm"
            >
              {Object.entries(CONTENT_TYPE_META).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          {value.type === 'code' && (
            <div className="w-40">
              <label className="block text-xs font-medium text-gray-500 mb-1">Language</label>
              <input
                type="text"
                placeholder="js, python, bash..."
                value={value.language}
                onChange={e => onChange({ ...value, language: e.target.value })}
                className="input-modern text-sm"
              />
            </div>
          )}
        </div>

        {(value.type === 'text' || value.type === 'code') && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {value.type === 'code' ? 'Code' : 'Text / Markdown'}
            </label>
            <textarea
              rows={value.type === 'code' ? 6 : 4}
              value={value.body}
              onChange={e => onChange({ ...value, body: e.target.value })}
              className="input-modern resize-y font-mono text-sm"
              placeholder={value.type === 'code' ? 'const x = 1;' : 'Write markdown or plain text...'}
            />
          </div>
        )}

        {(value.type === 'video' || value.type === 'image' || value.type === 'file') && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">URL</label>
            <input
              type="url"
              value={value.url}
              onChange={e => onChange({ ...value, url: e.target.value })}
              className="input-modern text-sm"
              placeholder="https://..."
            />
          </div>
        )}

        {value.type === 'file' && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">File name (display)</label>
            <input
              type="text"
              value={value.file_name}
              onChange={e => onChange({ ...value, file_name: e.target.value })}
              className="input-modern text-sm"
              placeholder="lecture-notes.pdf"
            />
          </div>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" onClick={onSave} isLoading={isSaving}>{label}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Content Blocks</span>
          <span className="text-xs text-gray-400">({blocks.length})</span>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setEditingBlock(null) }}
          className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          <Plus className="w-4 h-4" /> Add Block
        </button>
      </div>

      {blocks.length === 0 && !showAddForm && (
        <p className="text-sm text-gray-400 dark:text-gray-500 italic">
          No content blocks yet. Click "Add Block" to create one.
        </p>
      )}

      {blocks.map((block, idx) => {
        const meta = CONTENT_TYPE_META[block.type] || CONTENT_TYPE_META.text
        const isEditing = editingBlock?.id === block.id
        return (
          <div key={block.id} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-900">
              <span className="text-xs text-gray-400 w-5 text-center">{idx + 1}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
                {meta.label}{block.language ? ` · ${block.language}` : ''}
              </span>
              <span className="flex-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                {block.body ? block.body.slice(0, 90) : block.url || ''}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditingBlock(isEditing ? null : { ...block })}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <Edit className="w-3.5 h-3.5 text-gray-400 hover:text-primary-600" />
                </button>
                <button
                  onClick={() => handleDelete(block.id)}
                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                </button>
              </div>
            </div>

            {isEditing && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-200 dark:border-gray-700">
                <BlockForm
                  value={editingBlock}
                  onChange={setEditingBlock}
                  onSave={() => handleUpdate(editingBlock)}
                  onCancel={() => setEditingBlock(null)}
                  label="Save Changes"
                />
              </div>
            )}
          </div>
        )
      })}

      {showAddForm && (
        <BlockForm
          value={newBlock}
          onChange={setNewBlock}
          onSave={handleAdd}
          onCancel={() => { setShowAddForm(false); setNewBlock({ ...EMPTY_BLOCK }) }}
          label="Add Block"
        />
      )}
    </div>
  )
}

export default LessonContentPanel
