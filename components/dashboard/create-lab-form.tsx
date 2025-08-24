'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FlaskConical, Building2, Users, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface CreateLabFormProps {
  user: any
}

export function CreateLabForm({ user }: CreateLabFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Lab name is required')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/labs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create lab')
      }

      // Mark onboarding as completed for new users
      try {
        await fetch('/api/user/preferences', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            onboarding_completed: true,
            last_selected_lab_id: data.lab.id,
          }),
        })
      } catch (error) {
        console.warn('Failed to update onboarding status:', error)
      }

      toast.success(`Lab "${name}" created successfully!`)
      
      // Redirect to the new lab workspace
      router.push(`/dashboard/labs/${data.lab.id}`)
    } catch (error: any) {
      console.error('Create lab error:', error)
      toast.error(error.message || 'Failed to create lab')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Preview Card */}
      <Card className="card-slack">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
              <FlaskConical className="h-5 w-5 text-violet-600" />
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Preview</div>
            </div>
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">
              {name || 'Lab Name'}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {description || 'Lab description will appear here...'}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="space-y-1">
              <div className="flex items-center justify-center">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-sm font-medium text-foreground">0</div>
              <div className="text-xs text-muted-foreground">Studies</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-sm font-medium text-foreground">0</div>
              <div className="text-xs text-muted-foreground">Buckets</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center">
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-sm font-medium text-foreground">1</div>
              <div className="text-xs text-muted-foreground">Members</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card className="card-slack">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Lab Details
          </CardTitle>
          <CardDescription>
            Provide basic information about your research laboratory
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Lab Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Lab Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Cardiovascular Research Lab"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                maxLength={100}
                required
              />
              <p className="text-xs text-muted-foreground">
                Choose a clear, descriptive name for your laboratory
              </p>
            </div>

            {/* Lab Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of your lab's research focus and goals..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                maxLength={500}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Optional: Describe your lab's research focus, goals, or specialization
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !name.trim()}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating Lab...
                  </>
                ) : (
                  <>
                    <FlaskConical className="h-4 w-4 mr-2" />
                    Create Lab
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}