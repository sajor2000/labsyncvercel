'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { Users, Search, Plus, ArrowRight, Loader2, Mail } from 'lucide-react'
import Link from 'next/link'

export default function JoinLabPage() {
  const [inviteCode, setInviteCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newLabName, setNewLabName] = useState('')
  const [newLabDescription, setNewLabDescription] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleJoinLab = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code')
      return
    }

    setIsJoining(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('You must be logged in to join a lab')
        return
      }

      // Call the database function to join lab
      const { data, error } = await supabase.rpc('join_lab_by_invite', {
        invite_code: inviteCode.trim().toUpperCase(),
        joining_user_id: user.id
      })

      if (error) throw error

      if (data) {
        toast.success('Successfully joined lab!')
        router.push('/dashboard')
      } else {
        toast.error('Invalid invite code or you may already be a member')
      }
    } catch (error: any) {
      console.error('Error joining lab:', error)
      if (error.message?.includes('not found')) {
        toast.error('Invalid invite code')
      } else if (error.message?.includes('already a member')) {
        toast.error('You are already a member of this lab')
      } else {
        toast.error(error.message || 'Failed to join lab')
      }
    } finally {
      setIsJoining(false)
    }
  }

  const handleCreateLab = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLabName.trim()) {
      toast.error('Please enter a lab name')
      return
    }

    setIsCreating(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('You must be logged in to create a lab')
        return
      }

      // Create the lab
      const { data: lab, error: labError } = await supabase
        .from('labs')
        .insert([
          {
            name: newLabName.trim(),
            description: newLabDescription.trim() || null,
            created_by: user.id
          }
        ])
        .select()
        .single()

      if (labError) throw labError

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('lab_members')
        .insert([
          {
            lab_id: lab.id,
            user_id: user.id,
            role: 'lab_director',
            is_active: true,
            permissions: {
              can_manage_members: true,
              can_create_studies: true,
              can_edit_studies: true,
              can_delete_studies: true,
              can_manage_tasks: true,
              can_view_reports: true,
              can_export_data: true
            }
          }
        ])

      if (memberError) throw memberError

      toast.success(`Lab "${lab.name}" created successfully!`)
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error creating lab:', error)
      toast.error(error.message || 'Failed to create lab')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
                <span className="text-sm font-bold text-white">LS</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Lab Sync</h1>
                <p className="text-xs text-slate-400">Making Science Easier</p>
              </div>
            </div>
            <Link
              href="/auth/signin"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Sign out
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600/10 border border-violet-600/20">
            <Users className="h-8 w-8 text-violet-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Join or Create a Lab</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            To get started with Lab Sync, you'll need to join an existing research lab or create your own.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Join Lab Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
            <div className="flex items-center mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 border border-blue-600/20 mr-4">
                <Search className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Join Existing Lab</h2>
                <p className="text-slate-400 text-sm">Use an invite code from your lab</p>
              </div>
            </div>

            <form onSubmit={handleJoinLab} className="space-y-6">
              <div>
                <label htmlFor="inviteCode" className="block text-sm font-medium text-slate-300 mb-2">
                  Invite Code
                </label>
                <input
                  id="inviteCode"
                  name="inviteCode"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase tracking-wide"
                  placeholder="Enter invite code (e.g., ABC123)"
                  disabled={isJoining}
                  maxLength={10}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Ask your lab administrator for the invite code
                </p>
              </div>

              <button
                type="submit"
                disabled={isJoining || !inviteCode.trim()}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
              >
                {isJoining ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Joining lab...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Join Lab
                  </div>
                )}
              </button>
            </form>
          </div>

          {/* Create Lab Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
            <div className="flex items-center mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/10 border border-violet-600/20 mr-4">
                <Plus className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Create New Lab</h2>
                <p className="text-slate-400 text-sm">Start your own research lab</p>
              </div>
            </div>

            {!showCreateForm ? (
              <div className="space-y-6">
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <h3 className="font-medium text-white mb-2">What you'll get:</h3>
                  <ul className="space-y-2 text-sm text-slate-400">
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-2" />
                      Full admin access to your lab
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-2" />
                      Invite and manage team members
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-2" />
                      Create and manage studies
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-2" />
                      Track tasks and deadlines
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                >
                  <div className="flex items-center justify-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Lab
                  </div>
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateLab} className="space-y-6">
                <div>
                  <label htmlFor="labName" className="block text-sm font-medium text-slate-300 mb-2">
                    Lab Name *
                  </label>
                  <input
                    id="labName"
                    name="labName"
                    type="text"
                    value={newLabName}
                    onChange={(e) => setNewLabName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="e.g., Smith Research Lab"
                    disabled={isCreating}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="labDescription" className="block text-sm font-medium text-slate-300 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    id="labDescription"
                    name="labDescription"
                    rows={3}
                    value={newLabDescription}
                    onChange={(e) => setNewLabDescription(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                    placeholder="Brief description of your research lab..."
                    disabled={isCreating}
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false)
                      setNewLabName('')
                      setNewLabDescription('')
                    }}
                    className="flex-1 py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                    disabled={isCreating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || !newLabName.trim()}
                    className="flex-1 py-2.5 px-4 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                  >
                    {isCreating ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Creating...
                      </div>
                    ) : (
                      'Create Lab'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-16 text-center">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Need Help?</h3>
            <p className="text-slate-400 mb-4">
              If you don't have an invite code or need assistance creating a lab, contact your system administrator or IT support.
            </p>
            <p className="text-sm text-slate-500">
              Lab Sync is designed for research teams and scientific collaboration.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}