import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLabContext } from "@/hooks/useLabContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  Search, 
  Filter,
  Download,
  Eye,
  Calendar,
  User,
  Target,
  Lightbulb,
  Clock,
  ChevronRight,
  ChevronDown,
  Files,
  Archive
} from "lucide-react";
import { AttachmentViewer } from "@/components/AttachmentViewer";
import type { Study, Task, Idea, Deadline, Attachment } from "@shared/schema";

interface FileSystemNode {
  type: 'folder' | 'file';
  name: string;
  path: string;
  children?: FileSystemNode[];
  attachment?: Attachment;
  entityType?: 'PROJECT' | 'TASK' | 'IDEA' | 'DEADLINE';
  entityId?: string;
  entityData?: Study | Task | Idea | Deadline;
}

export default function FileManagement() {
  const { selectedLab } = useLabContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("ALL");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['studies', 'ideas', 'deadlines']));
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

  // Fetch all data
  const { data: studies = [] } = useQuery<Study[]>({
    queryKey: ["/api/studies"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: ideas = [] } = useQuery<Idea[]>({
    queryKey: ["/api/ideas"],
  });

  const { data: deadlines = [] } = useQuery<Deadline[]>({
    queryKey: ["/api/deadlines"],
  });

  const { data: attachments = [] } = useQuery<Attachment[]>({
    queryKey: ["/api/attachments"],
  });

  // Filter data by lab context
  const labFilteredStudies = selectedLab ? studies.filter(study => study.labId === selectedLab.id) : studies;
  const labFilteredTasks = selectedLab ? tasks.filter(task => {
    const taskStudy = studies.find(s => s.id === task.studyId);
    return taskStudy?.labId === selectedLab.id;
  }) : tasks;
  const labFilteredIdeas = selectedLab ? ideas.filter(idea => idea.labId === selectedLab.id) : ideas;
  const labFilteredDeadlines = selectedLab ? deadlines.filter(deadline => deadline.labId === selectedLab.id) : deadlines;

  // Build file system structure
  const buildFileSystem = (): FileSystemNode[] => {
    const root: FileSystemNode[] = [];

    // Studies folder
    const studiesFolder: FileSystemNode = {
      type: 'folder',
      name: 'Studies',
      path: 'studies',
      children: []
    };

    labFilteredStudies.forEach(study => {
      const studyAttachments = attachments.filter(att => att.entityType === 'PROJECT' && att.entityId === study.id);
      const studyTasks = labFilteredTasks.filter(task => task.studyId === study.id);
      
      const studyNode: FileSystemNode = {
        type: 'folder',
        name: study.name,
        path: `studies/${study.id}`,
        entityType: 'PROJECT',
        entityId: study.id,
        entityData: study,
        children: []
      };

      // Add study attachments
      studyAttachments.forEach(attachment => {
        studyNode.children!.push({
          type: 'file',
          name: attachment.filename,
          path: `studies/${study.id}/${attachment.id}`,
          attachment,
          entityType: 'PROJECT',
          entityId: study.id,
          entityData: study
        });
      });

      // Add tasks folder if tasks exist
      if (studyTasks.length > 0) {
        const tasksFolder: FileSystemNode = {
          type: 'folder',
          name: 'Tasks',
          path: `studies/${study.id}/tasks`,
          children: []
        };

        studyTasks.forEach(task => {
          const taskAttachments = attachments.filter(att => att.entityType === 'TASK' && att.entityId === task.id);
          
          const taskNode: FileSystemNode = {
            type: 'folder',
            name: task.title,
            path: `studies/${study.id}/tasks/${task.id}`,
            entityType: 'TASK',
            entityId: task.id,
            entityData: task,
            children: []
          };

          taskAttachments.forEach(attachment => {
            taskNode.children!.push({
              type: 'file',
              name: attachment.filename,
              path: `studies/${study.id}/tasks/${task.id}/${attachment.id}`,
              attachment,
              entityType: 'TASK',
              entityId: task.id,
              entityData: task
            });
          });

          if (taskNode.children!.length > 0) {
            tasksFolder.children!.push(taskNode);
          }
        });

        if (tasksFolder.children!.length > 0) {
          studyNode.children!.push(tasksFolder);
        }
      }

      studiesFolder.children!.push(studyNode);
    });

    root.push(studiesFolder);

    // Ideas folder
    const ideasFolder: FileSystemNode = {
      type: 'folder',
      name: 'Ideas',
      path: 'ideas',
      children: []
    };

    labFilteredIdeas.forEach(idea => {
      const ideaAttachments = attachments.filter(att => att.entityType === 'IDEA' && att.entityId === idea.id);
      
      if (ideaAttachments.length > 0) {
        const ideaNode: FileSystemNode = {
          type: 'folder',
          name: idea.title,
          path: `ideas/${idea.id}`,
          entityType: 'IDEA',
          entityId: idea.id,
          entityData: idea,
          children: []
        };

        ideaAttachments.forEach(attachment => {
          ideaNode.children!.push({
            type: 'file',
            name: attachment.filename,
            path: `ideas/${idea.id}/${attachment.id}`,
            attachment,
            entityType: 'IDEA',
            entityId: idea.id,
            entityData: idea
          });
        });

        ideasFolder.children!.push(ideaNode);
      }
    });

    root.push(ideasFolder);

    // Deadlines folder
    const deadlinesFolder: FileSystemNode = {
      type: 'folder',
      name: 'Deadlines',
      path: 'deadlines',
      children: []
    };

    labFilteredDeadlines.forEach(deadline => {
      const deadlineAttachments = attachments.filter(att => att.entityType === 'DEADLINE' && att.entityId === deadline.id);
      
      if (deadlineAttachments.length > 0) {
        const deadlineNode: FileSystemNode = {
          type: 'folder',
          name: deadline.title,
          path: `deadlines/${deadline.id}`,
          entityType: 'DEADLINE',
          entityId: deadline.id,
          entityData: deadline,
          children: []
        };

        deadlineAttachments.forEach(attachment => {
          deadlineNode.children!.push({
            type: 'file',
            name: attachment.filename,
            path: `deadlines/${deadline.id}/${attachment.id}`,
            attachment,
            entityType: 'DEADLINE',
            entityId: deadline.id,
            entityData: deadline
          });
        });

        deadlinesFolder.children!.push(deadlineNode);
      }
    });

    root.push(deadlinesFolder);

    return root;
  };

  const fileSystem = buildFileSystem();

  // Filter files based on search and type
  const filterFiles = (nodes: FileSystemNode[]): FileSystemNode[] => {
    return nodes.map(node => {
      if (node.type === 'folder' && node.children) {
        const filteredChildren = filterFiles(node.children);
        if (filteredChildren.length > 0 || node.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return { ...node, children: filteredChildren };
        }
        return null;
      } else if (node.type === 'file') {
        const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = fileTypeFilter === "ALL" || 
          (fileTypeFilter === "PDF" && node.attachment?.mimeType?.includes('pdf')) ||
          (fileTypeFilter === "IMAGES" && node.attachment?.mimeType?.includes('image')) ||
          (fileTypeFilter === "DOCUMENTS" && (
            node.attachment?.mimeType?.includes('document') ||
            node.attachment?.mimeType?.includes('word') ||
            node.attachment?.mimeType?.includes('text')
          ));
        
        return matchesSearch && matchesType ? node : null;
      }
      return node;
    }).filter(Boolean) as FileSystemNode[];
  };

  const filteredFileSystem = filterFiles(fileSystem);

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const getEntityIcon = (entityType?: string) => {
    switch (entityType) {
      case 'PROJECT': return <Target className="h-4 w-4 text-blue-500" />;
      case 'TASK': return <Calendar className="h-4 w-4 text-green-500" />;
      case 'IDEA': return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case 'DEADLINE': return <Clock className="h-4 w-4 text-red-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderFileSystemNode = (node: FileSystemNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const indentClass = `ml-${level * 4}`;

    if (node.type === 'folder') {
      return (
        <div key={node.path}>
          <div
            className={`flex items-center gap-2 p-2 hover:bg-muted/50 cursor-pointer rounded ${indentClass}`}
            onClick={() => toggleFolder(node.path)}
          >
            {isExpanded ? 
              <ChevronDown className="h-4 w-4 text-muted-foreground" /> : 
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            }
            {isExpanded ? 
              <FolderOpen className="h-4 w-4 text-blue-500" /> : 
              <Folder className="h-4 w-4 text-blue-500" />
            }
            <span className="font-medium">{node.name}</span>
            {node.entityType && getEntityIcon(node.entityType)}
            {node.children && (
              <Badge variant="outline" className="ml-auto text-xs">
                {node.children.length} files
              </Badge>
            )}
          </div>
          {isExpanded && node.children && (
            <div>
              {node.children.map(child => renderFileSystemNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div
          key={node.path}
          className={`flex items-center gap-2 p-2 hover:bg-muted/50 cursor-pointer rounded ${indentClass} ml-8`}
          onClick={() => setSelectedEntity(node.entityId || null)}
        >
          <FileText className="h-4 w-4 text-gray-500" />
          <span className="flex-1">{node.name}</span>
          {node.attachment && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {(parseInt(node.attachment.fileSize) / 1024).toFixed(1)} KB
              </Badge>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Eye className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Download className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      );
    }
  };

  const getTotalFileCount = (nodes: FileSystemNode[]): number => {
    return nodes.reduce((count, node) => {
      if (node.type === 'file') {
        return count + 1;
      } else if (node.children) {
        return count + getTotalFileCount(node.children);
      }
      return count;
    }, 0);
  };

  const totalFiles = getTotalFileCount(filteredFileSystem);

  return (
    <main className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">File Management</h1>
          <p className="text-muted-foreground">
            Organized file system for {selectedLab?.name || 'all labs'} - {totalFiles} files total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Files className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Hierarchical View</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File System Tree */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                File System
              </CardTitle>
              
              {/* Filters */}
              <div className="flex gap-4 pt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-files"
                  />
                </div>
                <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-file-type">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="File Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Files</SelectItem>
                    <SelectItem value="PDF">PDF Documents</SelectItem>
                    <SelectItem value="IMAGES">Images</SelectItem>
                    <SelectItem value="DOCUMENTS">Documents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-[600px] overflow-y-auto">
                {filteredFileSystem.length === 0 ? (
                  <div className="text-center py-8">
                    <Files className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {searchTerm || fileTypeFilter !== "ALL" 
                        ? "No files match your filters" 
                        : "No files found in this lab"}
                    </p>
                  </div>
                ) : (
                  filteredFileSystem.map(node => renderFileSystemNode(node))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* File Details Panel */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                File Viewer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEntity ? (
                <div className="space-y-4">
                  <AttachmentViewer
                    entityType={selectedEntity.startsWith('study') ? "PROJECT" : 
                               selectedEntity.startsWith('task') ? "TASK" :
                               selectedEntity.startsWith('idea') ? "IDEA" : "DEADLINE"}
                    entityId={selectedEntity}
                    compact={false}
                    showHeader={true}
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2" />
                  <p>Select a file to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}