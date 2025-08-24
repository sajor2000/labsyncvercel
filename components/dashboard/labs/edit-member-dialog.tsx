'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface LabMember {
  id: string
  userId: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  avatarUrl?: string
  role: string
  permissions: Record<string, boolean>
  isActive: boolean
  joinedAt: string
  updatedAt: string
}

interface EditMemberDialogProps {
  member: LabMember
  isOpen: boolean
  onClose: () => void
  onUpdate: (updates: Partial<LabMember>) => Promise<void>
}

const roleOptions = [
  { value: 'principal_investigator', label: 'Principal Investigator' },
  { value: 'co_investigator', label: 'Co-Investigator' },
  { value: 'lab_manager', label: 'Lab Manager' },
  { value: 'data_scientist', label: 'Data Scientist' },
  { value: 'data_analyst', label: 'Data Analyst' },
  { value: 'regulatory_coordinator', label: 'Regulatory Coordinator' },
  { value: 'lab_assistant', label: 'Lab Assistant' },
  { value: 'research_volunteer', label: 'Research Volunteer' },
  { value: 'external_collaborator', label: 'External Collaborator' },
]

const permissionLabels = {
  can_manage_members: 'Manage Members',
  can_create_studies: 'Create Studies',
  can_edit_studies: 'Edit Studies',
  can_delete_studies: 'Delete Studies',
  can_manage_tasks: 'Manage Tasks',
  can_view_reports: 'View Reports',
  can_export_data: 'Export Data',
  can_manage_lab: 'Manage Lab Settings',
  can_manage_permissions: 'Manage Permissions',
}

export default function EditMemberDialog({ member, isOpen, onClose, onUpdate }: EditMemberDialogProps) {
  const [role, setRole] = useState(member.role)
  const [permissions, setPermissions] = useState(member.permissions)
  const [isActive, setIsActive] = useState(member.isActive)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setRole(member.role)
    setPermissions(member.permissions)
    setIsActive(member.isActive)
  }, [member])

  const handlePermissionChange = (permission: string, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    try {
      await onUpdate({
        role,
        permissions,
        isActive: isActive
      })
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setRole(member.role)
    setPermissions(member.permissions)
    setIsActive(member.isActive)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Member: {member.fullName}</DialogTitle>
          <DialogDescription className="text-slate-400">
            Update {member.fullName}'s role and permissions in the lab.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="role" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-700">
              <TabsTrigger value="role" className="data-[state=active]:bg-violet-600">
                Role & Status
              </TabsTrigger>
              <TabsTrigger value="permissions" className="data-[state=active]:bg-violet-600">
                Permissions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="role" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {roleOptions.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className="text-white hover:bg-slate-700 focus:bg-slate-700"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is-active">Member Status</Label>
                  <p className="text-sm text-slate-400">
                    {isActive ? 'Active member with access to the lab' : 'Inactive - no access to lab'}
                  </p>
                </div>
                <Switch
                  id="is-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

              <div className="bg-slate-900 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-white">Member Information</h4>
                <div className="text-sm text-slate-400 space-y-1">
                  <p><strong>Email:</strong> {member.email}</p>
                  <p><strong>Joined:</strong> {new Date(member.joinedAt).toLocaleDateString()}</p>
                  <p><strong>Last Updated:</strong> {new Date(member.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-white mb-3">Lab Permissions</h4>
                  <p className="text-sm text-slate-400 mb-4">
                    Configure what this member can do in the lab.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(permissionLabels).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                      <div>
                        <Label htmlFor={key} className="text-white">
                          {label}
                        </Label>
                        <p className="text-xs text-slate-400">
                          {getPermissionDescription(key)}
                        </p>
                      </div>
                      <Switch
                        id={key}
                        checked={permissions[key] || false}
                        onCheckedChange={(value) => handlePermissionChange(key, value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
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
              className="bg-violet-600 hover:bg-violet-700"
            >
              {loading ? 'Updating...' : 'Update Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function getPermissionDescription(permission: string): string {
  const descriptions: Record<string, string> = {
    can_manage_members: 'Add, remove, and edit lab members',
    can_create_studies: 'Create new research studies',
    can_edit_studies: 'Modify existing studies',
    can_delete_studies: 'Delete studies from the lab',
    can_manage_tasks: 'Create and manage tasks',
    can_view_reports: 'View lab reports and analytics',
    can_export_data: 'Export data and generate reports',
    can_manage_lab: 'Edit lab settings and information',
    can_manage_permissions: 'Modify member permissions',
  }
  
  return descriptions[permission] || ''
}