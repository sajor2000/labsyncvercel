'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2, AlertTriangle, Save, Settings, Calendar, Link, Unlink, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Lab {
  id: string
  name: string
  description: string | null
  userRole: string
  memberCount: number
  studyCount: number
  is_active: boolean
  created_at: string
}

interface LabSettingsProps {
  lab: Lab
}

export default function LabSettings({ lab }: LabSettingsProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: lab.name,
    description: lab.description || '',
    is_active: lab.is_active
  })
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  
  // Calendar integration state
  const [calendarIntegration, setCalendarIntegration] = useState<any>(null)
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [isYourLab, setIsYourLab] = useState(false)

  const canDelete = lab.userRole === 'principal_investigator'
  const hasData = lab.memberCount > 1 || lab.studyCount > 0

  // Check if this is one of your labs (RICCC/RHEDAS) and fetch calendar integration
  useEffect(() => {
    const fetchCalendarIntegration = async () => {
      try {
        // Check if this is your lab by name patterns
        const yourLabNames = ['RICCC', 'RHEDAS', 'Rush Health Equity', 'Rush Interdisciplinary']
        const isYour = yourLabNames.some(name => lab.name.includes(name))
        setIsYourLab(isYour)

        // Fetch existing calendar integration
        const response = await fetch(`/api/labs/${lab.id}/calendar-integration`)
        if (response.ok) {
          const integration = await response.json()
          setCalendarIntegration(integration.integration)
        }
      } catch (error) {
        console.error('Error fetching calendar integration:', error)
      }
    }

    fetchCalendarIntegration()
  }, [lab.id, lab.name])

  const handleConnectGoogleCalendar = async () => {
    setCalendarLoading(true)
    try {
      // Start Google OAuth flow
      const response = await fetch(`/api/labs/${lab.id}/calendar-integration/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'google' })
      })

      if (response.ok) {
        const { authUrl } = await response.json()
        window.location.href = authUrl
      } else {
        throw new Error('Failed to start OAuth flow')
      }
    } catch (error) {
      console.error('Error connecting calendar:', error)
      toast.error('Failed to connect Google Calendar')
    } finally {
      setCalendarLoading(false)
    }
  }

  const handleUseRICCCalendar = async () => {
    setCalendarLoading(true)
    try {
      const response = await fetch(`/api/labs/${lab.id}/calendar-integration/ricc`, {
        method: 'POST'
      })

      if (response.ok) {
        const integration = await response.json()
        setCalendarIntegration(integration.integration)
        toast.success('RICCC Labs calendar connected successfully')
      } else {
        throw new Error('Failed to connect RICCC calendar')
      }
    } catch (error) {
      console.error('Error connecting RICCC calendar:', error)
      toast.error('Failed to connect RICCC Labs calendar')
    } finally {
      setCalendarLoading(false)
    }
  }

  const handleDisconnectCalendar = async () => {
    setCalendarLoading(true)
    try {
      const response = await fetch(`/api/labs/${lab.id}/calendar-integration`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCalendarIntegration(null)
        toast.success('Calendar disconnected successfully')
      } else {
        throw new Error('Failed to disconnect calendar')
      }
    } catch (error) {
      console.error('Error disconnecting calendar:', error)
      toast.error('Failed to disconnect calendar')
    } finally {
      setCalendarLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Lab name is required')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/labs/${lab.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          is_active: formData.is_active
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update lab')
      }

      toast.success('Lab settings updated successfully')
      
      // Refresh the page to show updated data
      router.refresh()
    } catch (error) {
      console.error('Error updating lab:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update lab')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (hardDelete = false) => {
    setDeleteLoading(true)
    try {
      const url = hardDelete 
        ? `/api/labs/${lab.id}?hard=true`
        : `/api/labs/${lab.id}`
        
      const response = await fetch(url, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete lab')
      }

      toast.success(hardDelete ? 'Lab deleted permanently' : 'Lab deactivated successfully')
      
      // Redirect to labs page
      router.push('/dashboard/labs')
    } catch (error) {
      console.error('Error deleting lab:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete lab')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>
            Update your lab's basic information and settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <Label htmlFor="name">Lab Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-slate-900 border-slate-600 text-white"
                placeholder="Enter lab name"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="bg-slate-900 border-slate-600 text-white"
                placeholder="Describe your lab's research focus and goals"
                rows={4}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is-active">Lab Status</Label>
                <p className="text-sm text-slate-400">
                  {formData.is_active 
                    ? 'Lab is active and accessible to all members'
                    : 'Lab is inactive - members cannot access it'
                  }
                </p>
              </div>
              <Switch
                id="is-active"
                checked={formData.is_active}
                onCheckedChange={(value) => setFormData(prev => ({ ...prev, is_active: value }))}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="bg-violet-600 hover:bg-violet-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Calendar Integration */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Integration
          </CardTitle>
          <CardDescription>
            Connect your lab with Google Calendar to sync meetings and deadlines.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {calendarIntegration ? (
            <div className="space-y-4">
              {/* Connected State */}
              <div className="flex items-center justify-between p-4 bg-green-900/20 border border-green-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <div>
                    <p className="text-white font-medium">
                      {calendarIntegration.provider === 'ricc' 
                        ? 'RICCC Labs Calendar' 
                        : 'Personal Google Calendar'} Connected
                    </p>
                    <p className="text-sm text-slate-400">
                      Calendar: {calendarIntegration.external_calendar_id}
                    </p>
                    {calendarIntegration.last_sync_at && (
                      <p className="text-xs text-slate-500">
                        Last synced: {new Date(calendarIntegration.last_sync_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnectCalendar}
                  disabled={calendarLoading}
                  className="text-red-400 border-red-600 hover:bg-red-900/20"
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>

              {/* Calendar Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('/api/calendar/sync', '_blank')}
                  className="text-blue-400 border-blue-600 hover:bg-blue-900/20"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Calendar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Not Connected State */}
              <div className="text-center py-6">
                <Calendar className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                <p className="text-white font-medium mb-2">No Calendar Connected</p>
                <p className="text-sm text-slate-400 mb-6">
                  Connect a calendar to sync lab meetings, deadlines, and events.
                </p>

                <div className="space-y-3">
                  {/* Your Labs: Show RICCC option */}
                  {isYourLab && (
                    <Button
                      onClick={handleUseRICCCalendar}
                      disabled={calendarLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Link className="h-4 w-4 mr-2" />
                      {calendarLoading ? 'Connecting...' : 'Use RICCC Labs Calendar'}
                    </Button>
                  )}

                  {/* All Labs: Personal Google Calendar option */}
                  <Button
                    variant="outline"
                    onClick={handleConnectGoogleCalendar}
                    disabled={calendarLoading}
                    className="w-full border-slate-600 hover:bg-slate-700"
                  >
                    <Link className="h-4 w-4 mr-2" />
                    {calendarLoading ? 'Connecting...' : 'Connect Personal Google Calendar'}
                  </Button>
                </div>

                <p className="text-xs text-slate-500 mt-4">
                  {isYourLab 
                    ? 'Your labs can use RICCC calendar or connect a personal calendar'
                    : 'Connect your Google Calendar to enable calendar features'
                  }
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lab Statistics */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Lab Statistics</CardTitle>
          <CardDescription>
            Overview of your lab's current status and activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{lab.memberCount}</div>
              <div className="text-sm text-slate-400">Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{lab.studyCount}</div>
              <div className="text-sm text-slate-400">Studies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">0</div>
              <div className="text-sm text-slate-400">Buckets</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${lab.is_active ? 'text-green-400' : 'text-red-400'}`}>
                {lab.is_active ? 'Active' : 'Inactive'}
              </div>
              <div className="text-sm text-slate-400">Status</div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-slate-900 rounded-lg">
            <p className="text-sm text-slate-400">
              <strong>Created:</strong> {new Date(lab.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {canDelete && (
        <Card className="bg-red-900/20 border-red-800/50">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription className="text-red-300/70">
              Irreversible and destructive actions for this lab.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Deactivate Lab */}
            {lab.is_active && (
              <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                <div>
                  <h4 className="text-white font-medium">Deactivate Lab</h4>
                  <p className="text-sm text-slate-400">
                    Temporarily deactivate this lab. Members won't be able to access it, but data will be preserved.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="border-yellow-600 text-yellow-400 hover:bg-yellow-600 hover:text-white">
                      Deactivate
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-slate-800 border-slate-700">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Deactivate Lab</AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-400">
                        This will temporarily deactivate "{lab.name}". Members won't be able to access it, 
                        but all data will be preserved. You can reactivate it later.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDelete(false)}
                        disabled={deleteLoading}
                        className="bg-yellow-600 hover:bg-yellow-700"
                      >
                        {deleteLoading ? 'Deactivating...' : 'Deactivate Lab'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}

            {/* Delete Lab */}
            <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
              <div>
                <h4 className="text-red-400 font-medium">Delete Lab Permanently</h4>
                <p className="text-sm text-slate-400">
                  Permanently delete this lab and all associated data. This action cannot be undone.
                </p>
                {hasData && (
                  <p className="text-sm text-orange-400 mt-1">
                    ⚠️ This lab has {lab.memberCount} members and {lab.studyCount} studies
                  </p>
                )}
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-800 border-slate-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-400">Delete Lab Permanently</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-400">
                      This will permanently delete "{lab.name}" and all associated data including:
                      <ul className="mt-2 ml-4 list-disc">
                        <li>{lab.memberCount} lab members</li>
                        <li>{lab.studyCount} studies</li>
                        <li>All associated tasks, files, and reports</li>
                      </ul>
                      <strong className="text-red-400">This action cannot be undone.</strong>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleDelete(true)}
                      disabled={deleteLoading}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}