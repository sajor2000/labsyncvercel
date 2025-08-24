"use client"

import { useRouter } from 'next/navigation'
import { 
  FolderOpen, 
  Beaker, 
  CheckCircle2, 
  Calendar, 
  Mic, 
  Lightbulb, 
  Clock, 
  FileText,
  Users,
  Settings
} from 'lucide-react'

interface LabWorkspaceClientProps {
  labId: string
}

export default function LabWorkspaceClient({ labId }: LabWorkspaceClientProps) {
  const router = useRouter()

  const features = [
    {
      title: "Project Buckets",
      description: "Organize projects into groups",
      icon: FolderOpen,
      color: "bg-blue-500/20",
      iconColor: "text-blue-400",
      href: `/dashboard/labs/${labId}/buckets`
    },
    {
      title: "Projects", 
      description: "Manage research projects",
      icon: Beaker,
      color: "bg-green-500/20",
      iconColor: "text-green-400",
      href: `/dashboard/labs/${labId}/projects`
    },
    {
      title: "Tasks",
      description: "Track work and assignments", 
      icon: CheckCircle2,
      color: "bg-purple-500/20",
      iconColor: "text-purple-400",
      href: `/dashboard/labs/${labId}/tasks`
    },
    {
      title: "Calendar",
      description: "Events and scheduling",
      icon: Calendar,
      color: "bg-orange-500/20", 
      iconColor: "text-orange-400",
      href: `/dashboard/labs/${labId}/calendar`
    },
    {
      title: "Meetings",
      description: "AI transcription & standups",
      icon: Mic,
      color: "bg-indigo-500/20",
      iconColor: "text-indigo-400", 
      href: `/dashboard/labs/${labId}/meetings`
    },
    {
      title: "Research Ideas",
      description: "Collaborate on innovations",
      icon: Lightbulb,
      color: "bg-yellow-500/20",
      iconColor: "text-yellow-400",
      href: `/dashboard/labs/${labId}/ideas`
    },
    {
      title: "Deadlines",
      description: "Track important dates",
      icon: Clock,
      color: "bg-red-500/20",
      iconColor: "text-red-400",
      href: `/dashboard/labs/${labId}/deadlines`
    },
    {
      title: "Files",
      description: "Share documents & data",
      icon: FileText,
      color: "bg-teal-500/20",
      iconColor: "text-teal-400",
      href: `/dashboard/labs/${labId}/files`
    },
    {
      title: "Team Members",
      description: "Manage lab team",
      icon: Users,
      color: "bg-pink-500/20",
      iconColor: "text-pink-400",
      href: `/dashboard/labs/${labId}#members`
    }
  ]

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-foreground mb-6">Lab Workspace</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {features.map((feature) => {
          const Icon = feature.icon
          
          return (
            <div 
              key={feature.title}
              className="card-slack p-4 hover:border-primary/50 transition-colors cursor-pointer group"
              onClick={() => {
                if (feature.href.includes('#')) {
                  // Handle anchor navigation
                  router.push(feature.href.split('#')[0])
                } else {
                  router.push(feature.href)
                }
              }}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${feature.color} group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-5 w-5 ${feature.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}