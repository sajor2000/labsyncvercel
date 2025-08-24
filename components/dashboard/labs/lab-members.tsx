'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  Shield,
  Crown,
  Settings
} from 'lucide-react'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import AddMemberDialog from './add-member-dialog'
import EditMemberDialog from './edit-member-dialog'
import { ErrorBoundaryWrapper } from '@/components/ui/error-boundary'
import { TableRowSkeleton } from '@/components/ui/skeleton'

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

interface LabMembersProps {
  labId: string
  userRole: string
}

export default function LabMembers({ labId, userRole }: LabMembersProps) {
  const [members, setMembers] = useState<LabMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingMember, setEditingMember] = useState<LabMember | null>(null)

  const canManageMembers = userRole === 'principal_investigator' || userRole === 'co_investigator' || userRole === 'lab_manager'

  useEffect(() => {
    fetchMembers()
  }, [labId])

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/labs/${labId}/members`)
      if (!response.ok) {
        throw new Error('Failed to fetch members')
      }
      const data = await response.json()
      setMembers(data.members)
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error('Failed to load lab members')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (memberData: { email: string; role: string }) => {
    try {
      const response = await fetch(`/api/labs/${labId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add member')
      }

      toast.success('Member added successfully')
      fetchMembers()
      setShowAddDialog(false)
    } catch (error) {
      console.error('Error adding member:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add member')
    }
  }

  const handleUpdateMember = async (memberId: string, updates: Partial<LabMember>) => {
    try {
      const response = await fetch(`/api/labs/${labId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update member')
      }

      toast.success('Member updated successfully')
      fetchMembers()
      setEditingMember(null)
    } catch (error) {
      console.error('Error updating member:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update member')
    }
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the lab?`)) {
      return
    }

    try {
      const response = await fetch(`/api/labs/${labId}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove member')
      }

      toast.success('Member removed successfully')
      fetchMembers()
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to remove member')
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'principal_investigator':
        return <Crown className="h-4 w-4 text-yellow-400" />
      case 'co_investigator':
      case 'lab_manager':
        return <Shield className="h-4 w-4 text-blue-400" />
      default:
        return <Users className="h-4 w-4 text-green-400" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'principal_investigator':
        return 'bg-yellow-100 text-yellow-800'
      case 'co_investigator':
        return 'bg-blue-100 text-blue-800'
      case 'lab_manager':
        return 'bg-purple-100 text-purple-800'
      case 'data_scientist':
      case 'data_analyst':
        return 'bg-cyan-100 text-cyan-800'
      case 'regulatory_coordinator':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-green-100 text-green-800'
    }
  }

  const filteredMembers = members.filter(member =>
    member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="animate-pulse flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-600 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-600 rounded w-1/4"></div>
                <div className="h-3 bg-slate-700 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Lab Members</h2>
          <p className="text-slate-400 text-sm">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </p>
        </div>
        {canManageMembers && (
          <Button onClick={() => setShowAddDialog(true)} className="bg-violet-600 hover:bg-violet-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-slate-800/50 border-slate-700 text-white"
        />
      </div>

      {/* Members List */}
      <div className="space-y-4">
        {filteredMembers.map((member) => (
          <div key={member.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <UserAvatar 
                  user={{
                    first_name: member.firstName,
                    last_name: member.lastName,
                    avatar_url: member.avatarUrl
                  } as any}
                  size="md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white">{member.fullName}</h3>
                    {getRoleIcon(member.role)}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                      {member.role.replace('_', ' ')}
                    </span>
                    {!member.isActive && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-sm">{member.email}</p>
                  <p className="text-slate-500 text-xs">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {canManageMembers && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                    <DropdownMenuItem 
                      onClick={() => setEditingMember(member)}
                      className="text-white hover:bg-slate-700"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Role
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setEditingMember(member)}
                      className="text-white hover:bg-slate-700"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Permissions
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-700" />
                    <DropdownMenuItem 
                      onClick={() => handleRemoveMember(member.id, member.fullName)}
                      className="text-red-400 hover:bg-slate-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        ))}

        {filteredMembers.length === 0 && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No members found</h3>
            <p className="text-slate-400">
              {searchTerm ? 'No members match your search.' : 'This lab has no members yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Add Member Dialog */}
      {showAddDialog && (
        <AddMemberDialog
          isOpen={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          onAdd={handleAddMember}
        />
      )}

      {/* Edit Member Dialog */}
      {editingMember && (
        <EditMemberDialog
          member={editingMember}
          isOpen={!!editingMember}
          onClose={() => setEditingMember(null)}
          onUpdate={(updates) => handleUpdateMember(editingMember.id, updates)}
        />
      )}
    </div>
  )
}