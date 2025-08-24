'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CreateLabDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateLabDialog({ isOpen, onClose, onSuccess }: CreateLabDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Lab name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Lab name must be at least 2 characters'
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Lab name must be less than 100 characters'
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/labs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create lab')
      }

      // Reset form
      setFormData({ name: '', description: '' })
      setErrors({})
      
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creating lab:', error)
      if (error instanceof Error && error.message.includes('already exists')) {
        setErrors({ name: 'A lab with this name already exists' })
      } else {
        setErrors({ general: error instanceof Error ? error.message : 'Failed to create lab' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ name: '', description: '' })
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Create New Lab</DialogTitle>
          <DialogDescription className="text-slate-400">
            Set up a new research laboratory to organize your team and studies.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-red-400 text-sm">{errors.general}</p>
            </div>
          )}

          <div>
            <Label htmlFor="name">Lab Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter lab name (e.g., 'Cardiac Research Lab')"
              className={`bg-slate-900 border-slate-600 text-white ${
                errors.name ? 'border-red-500' : ''
              }`}
              required
            />
            {errors.name && (
              <p className="text-red-400 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your lab's research focus, goals, and objectives..."
              className={`bg-slate-900 border-slate-600 text-white ${
                errors.description ? 'border-red-500' : ''
              }`}
              rows={4}
            />
            {errors.description && (
              <p className="text-red-400 text-sm mt-1">{errors.description}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">
              {formData.description.length}/500 characters
            </p>
          </div>

          <div className="bg-slate-900 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">What happens next?</h4>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• You'll be assigned as the Principal Investigator</li>
              <li>• You can invite team members with different roles</li>
              <li>• Start creating studies and managing research projects</li>
            </ul>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="bg-primary hover:bg-primary"
            >
              {loading ? 'Creating...' : 'Create Lab'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}