'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AddMemberDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: { email: string; role: string }) => Promise<void>
}

const roleOptions = [
  { value: 'principal_investigator', label: 'Principal Investigator', description: 'Full access to everything' },
  { value: 'co_investigator', label: 'Co-Investigator', description: 'Can manage studies and members' },
  { value: 'lab_manager', label: 'Lab Manager', description: 'Can manage day-to-day operations' },
  { value: 'data_scientist', label: 'Data Scientist', description: 'Can create and edit studies' },
  { value: 'data_analyst', label: 'Data Analyst', description: 'Can analyze and export data' },
  { value: 'regulatory_coordinator', label: 'Regulatory Coordinator', description: 'Handles compliance and documentation' },
  { value: 'lab_assistant', label: 'Lab Assistant', description: 'Basic access to view reports' },
  { value: 'research_volunteer', label: 'Research Volunteer', description: 'Limited access volunteer' },
  { value: 'external_collaborator', label: 'External Collaborator', description: 'External partner with limited access' },
]

export default function AddMemberDialog({ isOpen, onClose, onAdd }: AddMemberDialogProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!role) {
      newErrors.role = 'Please select a role'
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
      await onAdd({ email: email.trim(), role })
      
      // Reset form
      setEmail('')
      setRole('')
      setErrors({})
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setRole('')
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Add Lab Member</DialogTitle>
          <DialogDescription className="text-slate-400">
            Invite a new member to join this lab. They must already have an account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter their email address"
              className={`bg-slate-900 border-slate-600 text-white ${
                errors.email ? 'border-red-500' : ''
              }`}
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className={`bg-slate-900 border-slate-600 text-white ${
                errors.role ? 'border-red-500' : ''
              }`}>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {roleOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="text-white hover:bg-slate-700 focus:bg-slate-700"
                  >
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-slate-400">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-red-400 text-sm mt-1">{errors.role}</p>
            )}
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
              disabled={loading}
              className="bg-primary hover:bg-primary"
            >
              {loading ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}