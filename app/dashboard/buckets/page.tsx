"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FolderOpen, Plus, Search, Calendar, User, Archive, Edit2, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

// Schema from combined_migration_fixed.sql lines 37-51
interface ProjectBucket {
  id: string                    // UUID PRIMARY KEY
  name: string                  // VARCHAR(255) NOT NULL
  description: string | null    // TEXT
  lab_id: string                // UUID NOT NULL -> labs(id)
  created_by: string | null     // UUID -> auth.users(id)
  color: string | null          // VARCHAR(7)
  icon: string | null           // VARCHAR(50)
  position: number | null       // INTEGER DEFAULT 0
  is_active: boolean            // BOOLEAN DEFAULT true
  custom_fields: any            // JSONB DEFAULT '{}'
  field_definitions: string[]   // UUID[] DEFAULT '{}'
  created_at: string            // TIMESTAMPTZ DEFAULT NOW()
  updated_at: string            // TIMESTAMPTZ DEFAULT NOW()
  // Joined relations
  creator?: {
    id: string
    email: string
    full_name: string | null
  }
}

export default function BucketsPage() {
  const [buckets, setBuckets] = useState<ProjectBucket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "archived">("active")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedBucket, setSelectedBucket] = useState<ProjectBucket | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentLabId, setCurrentLabId] = useState<string | null>(null)
  
  // Form state for new/edit bucket
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
    icon: "folder"
  })

  const supabase = createClient()

  useEffect(() => {
    fetchBuckets()
    getCurrentLab()
  }, [filterStatus])

  const getCurrentLab = async () => {
    // Get current user's active lab
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("last_selected_lab_id")
      .eq("id", user.id)
      .single()

    if (profile?.last_selected_lab_id) {
      setCurrentLabId(profile.last_selected_lab_id)
    } else {
      // Fallback to first lab membership
      const { data: membership } = await supabase
        .from("lab_members")
        .select("lab_id")
        .eq("user_id", user.id)
        .limit(1)
        .single()

      if (membership) {
        setCurrentLabId(membership.lab_id)
      }
    }
  }

  const fetchBuckets = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's lab memberships
      const { data: memberships } = await supabase
        .from("lab_members")
        .select("lab_id")
        .eq("user_id", user.id)

      if (!memberships || memberships.length === 0) return

      const labIds = memberships.map(m => m.lab_id)

      let query = supabase
        .from("project_buckets")
        .select(`
          *,
          creator:user_profiles!project_buckets_created_by_fkey(
            id,
            email,
            full_name
          )
        `)
        .in("lab_id", labIds)
        .order("position", { ascending: true })
        .order("created_at", { ascending: false })

      if (filterStatus === "active") {
        query = query.eq("is_active", true)
      } else if (filterStatus === "archived") {
        query = query.eq("is_active", false)
      }

      const { data, error } = await query

      if (error) throw error
      setBuckets(data || [])
    } catch (error) {
      console.error("Error fetching buckets:", error)
      toast.error("Failed to load buckets")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBucket = async () => {
    if (!currentLabId) {
      toast.error("No active lab selected")
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("project_buckets")
        .insert({
          name: formData.name,
          description: formData.description || null,
          lab_id: currentLabId,
          created_by: user.id,
          color: formData.color || null,
          icon: formData.icon || null,
          position: buckets.length,
          is_active: true,
          custom_fields: {},
          field_definitions: []
        })
        .select()
        .single()

      if (error) throw error

      toast.success("Bucket created successfully")
      setIsCreateDialogOpen(false)
      setFormData({
        name: "",
        description: "",
        color: "#3B82F6",
        icon: "folder"
      })
      fetchBuckets()
    } catch (error) {
      console.error("Error creating bucket:", error)
      toast.error("Failed to create bucket")
    }
  }

  const handleUpdateBucket = async () => {
    if (!selectedBucket) return

    try {
      const { data, error } = await supabase
        .from("project_buckets")
        .update({
          name: formData.name,
          description: formData.description || null,
          color: formData.color || null,
          icon: formData.icon || null
        })
        .eq("id", selectedBucket.id)
        .select()
        .single()

      if (error) throw error

      toast.success("Bucket updated successfully")
      setSelectedBucket(null)
      setFormData({
        name: "",
        description: "",
        color: "#3B82F6",
        icon: "folder"
      })
      fetchBuckets()
    } catch (error) {
      console.error("Error updating bucket:", error)
      toast.error("Failed to update bucket")
    }
  }

  // Archive/restore bucket functionality
  const toggleArchive = async (bucket: ProjectBucket) => {
    try {
      const { error } = await supabase
        .from("project_buckets")
        .update({ is_active: !bucket.is_active })
        .eq("id", bucket.id)

      if (error) throw error
      
      fetchBuckets()
      toast.success(bucket.is_active ? "Bucket archived" : "Bucket restored")
    } catch (error) {
      console.error("Error toggling archive:", error)
      toast.error("Failed to update bucket status")
    }
  }


  const deleteBucket = async (bucketId: string) => {
    if (!confirm("Are you sure you want to delete this bucket? This action cannot be undone.")) {
      return
    }

    try {
      const { error } = await supabase
        .from("project_buckets")
        .delete()
        .eq("id", bucketId)

      if (error) throw error
      
      fetchBuckets()
      toast.success("Bucket deleted successfully")
    } catch (error) {
      console.error("Error deleting bucket:", error)
      toast.error("Failed to delete bucket")
    }
  }

  const filteredBuckets = buckets.filter(bucket => 
    bucket.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bucket.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Since parent_bucket_id doesn't exist, all buckets are at the same level
  const parentBuckets = filteredBuckets

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-muted-foreground">Loading buckets...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Buckets</h1>
          <p className="text-muted-foreground">
            Organize your research projects into logical groups
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Bucket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Bucket</DialogTitle>
              <DialogDescription>
                Create a new project bucket to organize your studies
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Clinical Trials Q1 2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the purpose of this bucket..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-20"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateBucket}>
                Create Bucket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search buckets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <TabsList>
            <TabsTrigger value="grid">Grid</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Buckets Display */}
      {filteredBuckets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No buckets found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery ? "Try adjusting your search query" : "Create your first bucket to get started"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Bucket
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === "grid" ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
          {parentBuckets.map((bucket) => (
            <div key={bucket.id}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: bucket.color || "#3B82F6" }}
                      />
                      <CardTitle className="text-lg">{bucket.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleArchive(bucket)}
                        title={bucket.is_active ? "Archive bucket" : "Restore bucket"}
                      >
                        <Archive className={`h-4 w-4 ${!bucket.is_active ? 'opacity-50' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedBucket(bucket)
                          setFormData({
                            name: bucket.name,
                            description: bucket.description || "",
                            color: bucket.color || "#3B82F6",
                            icon: bucket.icon || "folder",
                          })
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteBucket(bucket.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {bucket.description && (
                    <CardDescription className="mt-2">
                      {bucket.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      {bucket.creator && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{bucket.creator.full_name || bucket.creator.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(bucket.created_at), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                    {!bucket.is_active && (
                      <Badge variant="secondary">Archived</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!selectedBucket} onOpenChange={(open) => !open && setSelectedBucket(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bucket</DialogTitle>
            <DialogDescription>
              Update the bucket details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Clinical Trials Q1 2024"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the purpose of this bucket..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3B82F6"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedBucket(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBucket}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}