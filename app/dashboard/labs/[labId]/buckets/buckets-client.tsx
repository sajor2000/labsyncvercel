"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { FolderOpen, Plus, Search, Edit2, Trash2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import Link from "next/link"

interface Bucket {
  id: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  position: number | null
  status: string
  created_at: string
  updated_at: string
}

interface Lab {
  id: string
  name: string
  description: string | null
}

interface BucketsPageClientProps {
  lab: Lab
  initialBuckets: Bucket[]
  userPermissions: {
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
  }
}

export default function BucketsPageClient({ 
  lab, 
  initialBuckets, 
  userPermissions 
}: BucketsPageClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [buckets, setBuckets] = useState<Bucket[]>(initialBuckets)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6'
  })

  const filteredBuckets = buckets.filter(bucket =>
    bucket.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (bucket.description && bucket.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleCreateBucket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('buckets')
        .insert({
          lab_id: lab.id,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          color: formData.color,
          icon: 'folder',
          position: buckets.length
        })
        .select()
        .single()

      if (error) throw error

      setBuckets(prev => [...prev, data])
      setFormData({ name: '', description: '', color: '#3b82f6' })
      setIsCreateDialogOpen(false)
      toast.success('Bucket created successfully!')
      
    } catch (error: any) {
      console.error('Error creating bucket:', error)
      toast.error('Failed to create bucket')
    } finally {
      setLoading(false)
    }
  }

  const handleEditBucket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBucket || !formData.name.trim()) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('buckets')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          color: formData.color
        })
        .eq('id', selectedBucket.id)
        .select()
        .single()

      if (error) throw error

      setBuckets(prev => prev.map(b => b.id === selectedBucket.id ? data : b))
      setFormData({ name: '', description: '', color: '#3b82f6' })
      setIsEditDialogOpen(false)
      setSelectedBucket(null)
      toast.success('Bucket updated successfully!')
      
    } catch (error: any) {
      console.error('Error updating bucket:', error)
      toast.error('Failed to update bucket')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBucket = async () => {
    if (!selectedBucket) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('buckets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', selectedBucket.id)

      if (error) throw error

      setBuckets(prev => prev.filter(b => b.id !== selectedBucket.id))
      setIsDeleteDialogOpen(false)
      setSelectedBucket(null)
      toast.success('Bucket deleted successfully!')
      
    } catch (error: any) {
      console.error('Error deleting bucket:', error)
      toast.error('Failed to delete bucket')
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (bucket: Bucket) => {
    setSelectedBucket(bucket)
    setFormData({
      name: bucket.name,
      description: bucket.description || '',
      color: bucket.color || '#3b82f6'
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (bucket: Bucket) => {
    setSelectedBucket(bucket)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href={`/dashboard/labs/${lab.id}`}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {lab.name} - Project Buckets
            </h1>
            <p className="text-muted-foreground">
              Organize your lab's projects into logical groups and categories
            </p>
          </div>
        </div>
        
        {userPermissions.canCreate && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-slack-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Bucket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project Bucket</DialogTitle>
                <DialogDescription>
                  Create a new bucket to organize projects in {lab.name}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateBucket} className="space-y-4">
                <div>
                  <Label htmlFor="bucket-name">Bucket Name</Label>
                  <Input
                    id="bucket-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Clinical Studies, Data Analysis..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="bucket-description">Description</Label>
                  <Textarea
                    id="bucket-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the purpose and scope of this bucket"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="bucket-color">Color</Label>
                  <Input
                    id="bucket-color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Bucket'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search buckets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Buckets Grid */}
      {filteredBuckets.length === 0 ? (
        <Card className="card-slack p-12 text-center">
          <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium text-foreground mb-2">
            {buckets.length === 0 ? 'No Project Buckets Yet' : 'No Matching Buckets'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {buckets.length === 0 
              ? 'Create your first project bucket to organize your lab\'s research projects'
              : 'Try adjusting your search terms'
            }
          </p>
          {userPermissions.canCreate && buckets.length === 0 && (
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="btn-slack-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Bucket
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBuckets.map((bucket) => (
            <Card key={bucket.id} className="card-slack hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: bucket.color || '#6b7280' }}
                    />
                    <CardTitle className="text-lg">{bucket.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {bucket.status === 'active' ? 'Active' : 'Archived'}
                  </Badge>
                </div>
                {bucket.description && (
                  <CardDescription>{bucket.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Created {format(new Date(bucket.created_at), 'MMM d, yyyy')}
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => router.push(`/dashboard/labs/${lab.id}/buckets/${bucket.id}`)}
                    >
                      View Projects
                    </Button>
                    {userPermissions.canEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(bucket)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    {userPermissions.canDelete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openDeleteDialog(bucket)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Bucket Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bucket</DialogTitle>
            <DialogDescription>
              Update the bucket details for {lab.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditBucket} className="space-y-4">
            <div>
              <Label htmlFor="edit-bucket-name">Bucket Name</Label>
              <Input
                id="edit-bucket-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Clinical Studies, Data Analysis..."
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-bucket-description">Description</Label>
              <Textarea
                id="edit-bucket-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the purpose and scope of this bucket"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-bucket-color">Color</Label>
              <Input
                id="edit-bucket-color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Bucket'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Bucket Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bucket</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedBucket?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              All projects in this bucket will need to be reassigned to another bucket.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteBucket}
              disabled={loading}
              variant="destructive"
            >
              {loading ? 'Deleting...' : 'Delete Bucket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}