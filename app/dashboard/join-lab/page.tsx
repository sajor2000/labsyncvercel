'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, Plus, ArrowLeft, Beaker } from 'lucide-react'
import Link from 'next/link'

export default function JoinLabPage() {
  const [inviteCode, setInviteCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
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
        router.push('/auth/signin')
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Simple Header */}
      <header className="w-full border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Beaker className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-foreground">Lab Sync</span>
            </Link>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-4">Join a Research Lab</h1>
          <p className="text-muted-foreground text-lg">
            Enter your invite code to join an existing lab, or create a new one
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Join Lab Card */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Join Existing Lab</CardTitle>
              <CardDescription>
                Use an invite code from your lab administrator
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinLab} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteCode">Invite Code</Label>
                  <Input
                    id="inviteCode"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="Enter code (e.g., ABC123)"
                    className="h-11 uppercase tracking-wide"
                    disabled={isJoining}
                    maxLength={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ask your lab administrator for the invite code
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={isJoining || !inviteCode.trim()}
                >
                  {isJoining ? 'Joining lab...' : 'Join Lab'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Create Lab Card */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Create New Lab</CardTitle>
              <CardDescription>
                Start your own research laboratory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p className="font-medium">As a lab creator, you'll get:</p>
                  <ul className="space-y-1">
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2" />
                      Full administrative control
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2" />
                      Member management
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2" />
                      Study creation tools
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2" />
                      Task tracking system
                    </li>
                  </ul>
                </div>

                <Button
                  onClick={() => router.push('/dashboard/labs/new')}
                  className="w-full h-11"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Lab
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <div className="mt-16 text-center">
          <Card className="bg-muted/30 border-border/30 max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">Need Help?</h3>
              <p className="text-muted-foreground text-sm">
                If you don't have an invite code or need assistance, contact your lab administrator.
                Lab Sync is designed for seamless research team collaboration.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}