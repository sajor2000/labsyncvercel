"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  File, 
  FileText, 
  FileImage, 
  FileVideo, 
  FileAudio,
  FilePlus,
  Upload, 
  Download, 
  Search, 
  Filter, 
  FolderOpen,
  Eye,
  Trash2,
  Share2,
  Link,
  Calendar,
  User,
  HardDrive,
  Grid,
  List
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

interface FileRecord {
  id: string
  lab_id: string
  study_id: string | null
  task_id: string | null
  name: string
  file_path: string | null
  file_url: string | null
  file_size: number | null
  mime_type: string | null
  uploaded_by: string | null
  description: string | null
  tags: any | null
  version: number | null
  is_latest: boolean | null
  parent_file_id: string | null
  created_at: string | null
  updated_at: string | null
  uploader?: {
    id: string
    email: string
    full_name: string | null
  }
  study?: {
    id: string
    title: string
  }
  bucket?: {
    id: string
    name: string
  }
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "documents" | "images" | "videos" | "audio">("all")
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [currentLabId, setCurrentLabId] = useState<string | null>(null)
  const [storageUsed, setStorageUsed] = useState(0)
  const [storageLimit] = useState(10 * 1024 * 1024 * 1024) // 10GB limit
  
  const supabase = createClient()

  useEffect(() => {
    fetchFiles()
    getCurrentLab()
    calculateStorageUsed()
  }, [filterType])

  const getCurrentLab = async () => {
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

  const fetchFiles = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: memberships } = await supabase
        .from("lab_members")
        .select("lab_id")
        .eq("user_id", user.id)

      if (!memberships || memberships.length === 0) return

      const labIds = memberships.map(m => m.lab_id)

      let query = supabase
        .from("files")
        .select(`
          *,
          uploader:user_profiles!files_uploaded_by_fkey(
            id,
            email,
            full_name
          ),
          study:studies!files_study_id_fkey(
            id,
            title
          ),
          bucket:project_buckets!files_bucket_id_fkey(
            id,
            name
          )
        `)
        .in("lab_id", labIds)
        .order("created_at", { ascending: false })

      // Apply type filter
      if (filterType === "documents") {
        query = query.in("mime_type", [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/plain",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ])
      } else if (filterType === "images") {
        query = query.like("mime_type", "image/%")
      } else if (filterType === "videos") {
        query = query.like("mime_type", "video/%")
      } else if (filterType === "audio") {
        query = query.like("mime_type", "audio/%")
      }

      const { data, error } = await query

      if (error) throw error
      setFiles(data || [])
    } catch (error) {
      console.error("Error fetching files:", error)
      toast.error("Failed to load files")
    } finally {
      setLoading(false)
    }
  }

  const calculateStorageUsed = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: memberships } = await supabase
        .from("lab_members")
        .select("lab_id")
        .eq("user_id", user.id)

      if (!memberships || memberships.length === 0) return

      const labIds = memberships.map(m => m.lab_id)

      const { data } = await supabase
        .from("files")
        .select("file_size")
        .in("lab_id", labIds)

      if (data) {
        const total = data.reduce((sum, file) => sum + (file.file_size || 0), 0)
        setStorageUsed(total)
      }
    } catch (error) {
      console.error("Error calculating storage:", error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !currentLabId) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentLabId}/${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('lab-files')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Create file record in database
      const { data, error } = await supabase
        .from("files")
        .insert({
          lab_id: currentLabId,
          name: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user.id
        })
        .select()
        .single()

      if (error) throw error

      toast.success("File uploaded successfully")
      setIsUploadDialogOpen(false)
      fetchFiles()
      calculateStorageUsed()
    } catch (error) {
      console.error("Error uploading file:", error)
      toast.error("Failed to upload file")
    }
  }

  const handleDownload = async (file: FileRecord) => {
    try {
      const { data, error } = await supabase.storage
        .from('lab-files')
        .download(file.file_path!)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading file:", error)
      toast.error("Failed to download file")
    }
  }

  const handleDelete = async (fileId: string, filePath: string) => {
    if (!confirm("Are you sure you want to delete this file? This action cannot be undone.")) {
      return
    }

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('lab-files')
        .remove([filePath])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from("files")
        .delete()
        .eq("id", fileId)

      if (dbError) throw dbError
      
      fetchFiles()
      calculateStorageUsed()
      toast.success("File deleted successfully")
    } catch (error) {
      console.error("Error deleting file:", error)
      toast.error("Failed to delete file")
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <FileImage className="h-5 w-5" />
    if (mimeType.startsWith("video/")) return <FileVideo className="h-5 w-5" />
    if (mimeType.startsWith("audio/")) return <FileAudio className="h-5 w-5" />
    if (mimeType.includes("pdf") || mimeType.includes("document") || mimeType.includes("text")) {
      return <FileText className="h-5 w-5" />
    }
    return <File className="h-5 w-5" />
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const storagePercentage = (storageUsed / storageLimit) * 100

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-muted-foreground">Loading files...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">File Management</h1>
          <p className="text-muted-foreground">
            Store and manage research files and documents
          </p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload File</DialogTitle>
              <DialogDescription>
                Select a file to upload to your lab's storage
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FilePlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-primary hover:underline">Choose a file</span>
                  <span className="text-muted-foreground"> or drag and drop</span>
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Maximum file size: 100MB
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Storage Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Storage Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {formatFileSize(storageUsed)} of {formatFileSize(storageLimit)} used
              </span>
              <span className="text-muted-foreground">
                {storagePercentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All Files</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <TabsList>
            <TabsTrigger value="grid">
              <Grid className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Files Display */}
      {filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No files found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery ? "Try adjusting your search query" : "Upload your first file to get started"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload First File
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredFiles.map((file) => (
            <Card key={file.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getFileIcon(file.mime_type || 'application/octet-stream')}
                    <CardTitle className="text-sm truncate">
                      {file.name}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(file.id, file.file_path || '')}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Size:</span>
                    <span>{formatFileSize(file.file_size || 0)}</span>
                  </div>
                  {file.study && (
                    <div className="flex items-center justify-between">
                      <span>Study:</span>
                      <span className="truncate ml-2">{file.study.title}</span>
                    </div>
                  )}
                  {file.bucket && (
                    <div className="flex items-center justify-between">
                      <span>Bucket:</span>
                      <span className="truncate ml-2">{file.bucket.name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>Uploaded:</span>
                    <span>{format(new Date(file.created_at || new Date()), "MMM d")}</span>
                  </div>
                  {file.uploader && (
                    <div className="flex items-center justify-between">
                      <span>By:</span>
                      <span className="truncate ml-2">
                        {file.uploader.full_name || file.uploader.email}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Size</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Modified</th>
                  <th className="p-4 font-medium">Uploaded By</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.mime_type || 'application/octet-stream')}
                        <span className="truncate max-w-[300px]">{file.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatFileSize(file.file_size || 0)}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {(file.mime_type || 'application/octet-stream').split('/')[1]?.toUpperCase() || 'FILE'}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {format(new Date(file.created_at || new Date()), "MMM d, yyyy")}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {file.uploader?.full_name || file.uploader?.email || 'Unknown'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(file)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(file.id, file.file_path || '')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}