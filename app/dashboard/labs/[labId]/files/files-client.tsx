"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  FileText, 
  Plus, 
  Search, 
  ArrowLeft, 
  Download, 
  Share2,
  Eye,
  Trash2,
  Upload,
  Folder,
  Image,
  Video,
  Music,
  Archive,
  Code,
  Database
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"

interface File {
  id: string
  name: string
  description: string | null
  file_type: string
  file_size: number
  mime_type: string | null
  storage_path: string
  storage_provider: string
  is_public: boolean
  download_count: number | null
  last_accessed_at: string | null
  uploaded_by: string
  project_id: string | null
  tags: string[] | null
  metadata: any
  is_deleted: boolean
  created_at: string
  updated_at: string
}

interface FileVersion {
  id: string
  file_id: string
  version_number: number
  file_size: number
  storage_path: string
  change_description: string | null
  uploaded_by: string
  created_at: string
}

interface FilePermission {
  id: string
  file_id: string
  user_id: string
  permission_type: string
  granted_by: string
  expires_at: string | null
  created_at: string
}

interface Project {
  id: string
  name: string
  bucket_id: string
}

interface Lab {
  id: string
  name: string
  description: string | null
}

interface LabMember {
  user_id: string
  role: string
  user_profiles: {
    id: string
    email: string
    full_name: string | null
    first_name: string | null
    last_name: string | null
  } | null
}

interface FilesPageClientProps {
  lab: Lab
  initialFiles: File[]
  fileVersions: FileVersion[]
  filePermissions: FilePermission[]
  projects: Project[]
  labMembers: LabMember[]
  userPermissions: {
    canUpload: boolean
    canShare: boolean
    canDelete: boolean
    canManagePermissions: boolean
  }
}

const fileTypeIcons = {
  'document': FileText,
  'spreadsheet': Database,
  'presentation': FileText,
  'image': Image,
  'video': Video,
  'audio': Music,
  'code': Code,
  'data': Database,
  'archive': Archive,
  'other': FileText
}

const fileTypeColors = {
  'document': 'bg-blue-500',
  'spreadsheet': 'bg-green-500',
  'presentation': 'bg-orange-500',
  'image': 'bg-purple-500',
  'video': 'bg-red-500',
  'audio': 'bg-pink-500',
  'code': 'bg-gray-500',
  'data': 'bg-teal-500',
  'archive': 'bg-yellow-500',
  'other': 'bg-slate-500'
}

export default function FilesPageClient({ 
  lab, 
  initialFiles,
  fileVersions,
  filePermissions,
  projects,
  labMembers,
  userPermissions 
}: FilesPageClientProps) {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>(initialFiles)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterProject, setFilterProject] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getMemberName = (userId: string) => {
    const member = labMembers.find(m => m.user_id === userId)
    if (!member || !member.user_profiles) return 'Unknown'
    
    const profile = member.user_profiles
    return profile.full_name || 
           `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
           profile.email || 'Unknown'
  }

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Unorganized'
  }

  const getFileVersionCount = (fileId: string) => {
    return fileVersions.filter(v => v.file_id === fileId).length
  }

  const getFilePermissionCount = (fileId: string) => {
    return filePermissions.filter(p => p.file_id === fileId).length
  }

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (file.description && file.description.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesType = filterType === "all" || file.file_type === filterType
    const matchesProject = filterProject === "all" || file.project_id === filterProject
    
    return matchesSearch && matchesType && matchesProject
  })

  const FileIcon = ({ fileType }: { fileType: string }) => {
    const Icon = fileTypeIcons[fileType as keyof typeof fileTypeIcons] || FileText
    return <Icon className="h-5 w-5" />
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
              {lab.name} - Files
            </h1>
            <p className="text-muted-foreground">
              Share documents, data, and resources with your lab team
            </p>
          </div>
        </div>
        
        {userPermissions.canUpload && (
          <Button className="btn-slack-primary">
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
            <SelectItem value="spreadsheet">Spreadsheets</SelectItem>
            <SelectItem value="presentation">Presentations</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="data">Data Files</SelectItem>
            <SelectItem value="code">Code</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            <SelectItem value="">Unorganized</SelectItem>
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={viewMode} onValueChange={(value: "grid" | "list") => setViewMode(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">Grid View</SelectItem>
            <SelectItem value="list">List View</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Files Display */}
      {filteredFiles.length === 0 ? (
        <Card className="card-slack p-12 text-center">
          <Folder className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium text-foreground mb-2">
            {files.length === 0 ? 'No Files Yet' : 'No Matching Files'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {files.length === 0 
              ? 'Upload your first files to start sharing resources with your lab'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          {userPermissions.canUpload && files.length === 0 && (
            <Button className="btn-slack-primary">
              <Upload className="h-4 w-4 mr-2" />
              Upload First Files
            </Button>
          )}
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredFiles.map((file) => {
            const versionCount = getFileVersionCount(file.id)
            const permissionCount = getFilePermissionCount(file.id)
            
            return (
              <Card key={file.id} className="card-slack hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${fileTypeColors[file.file_type as keyof typeof fileTypeColors] || 'bg-gray-500'}/20`}>
                      <FileIcon fileType={file.file_type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-medium truncate" title={file.name}>
                        {file.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.file_size)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {file.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {file.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{getMemberName(file.uploaded_by)}</span>
                    <span>{format(new Date(file.created_at), 'MMM d, yyyy')}</span>
                  </div>

                  {file.project_id && (
                    <Badge variant="outline" className="text-xs w-fit">
                      {getProjectName(file.project_id)}
                    </Badge>
                  )}

                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    {versionCount > 1 && (
                      <span>v{versionCount}</span>
                    )}
                    {file.download_count && file.download_count > 0 && (
                      <span>• {file.download_count} downloads</span>
                    )}
                    {file.is_public && (
                      <Badge variant="outline" className="text-xs">Public</Badge>
                    )}
                  </div>

                  <div className="flex space-x-1">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-3 w-3" />
                    </Button>
                    {userPermissions.canShare && (
                      <Button size="sm" variant="outline">
                        <Share2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2">
          {filteredFiles.map((file) => {
            const versionCount = getFileVersionCount(file.id)
            
            return (
              <Card key={file.id} className="card-slack hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg ${fileTypeColors[file.file_type as keyof typeof fileTypeColors] || 'bg-gray-500'}/20`}>
                        <FileIcon fileType={file.file_type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">{file.name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{formatFileSize(file.file_size)}</span>
                          <span>{getMemberName(file.uploaded_by)}</span>
                          <span>{format(new Date(file.created_at), 'MMM d, yyyy')}</span>
                          {file.project_id && (
                            <span>• {getProjectName(file.project_id)}</span>
                          )}
                          {versionCount > 1 && (
                            <Badge variant="outline" className="text-xs">v{versionCount}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3" />
                      </Button>
                      {userPermissions.canShare && (
                        <Button size="sm" variant="outline">
                          <Share2 className="h-3 w-3" />
                        </Button>
                      )}
                      {userPermissions.canDelete && (
                        <Button size="sm" variant="outline" className="text-red-400 border-red-600">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}