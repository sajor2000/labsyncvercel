'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Home, FlaskConical, Building2, FolderOpen, ListTodo, Calendar, Users, Settings, Lightbulb, Clock } from 'lucide-react'

interface LabBreadcrumbProps {
  lab: {
    id: string
    name: string
  }
}

export function LabBreadcrumb({ lab }: LabBreadcrumbProps) {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  
  // Extract the current page from the path
  const currentPage = segments[segments.length - 1]
  
  const getPageInfo = (page: string) => {
    const pageMap: Record<string, { name: string; icon: React.ComponentType<{ className?: string }> }> = {
      [lab.id]: { name: 'Dashboard', icon: Home },
      'buckets': { name: 'Buckets', icon: Building2 },
      'projects': { name: 'Projects', icon: FolderOpen },
      'tasks': { name: 'Tasks', icon: ListTodo },
      'calendar': { name: 'Calendar', icon: Calendar },
      'meetings': { name: 'Meetings', icon: Users },
      'ideas': { name: 'Ideas', icon: Lightbulb },
      'deadlines': { name: 'Deadlines', icon: Clock },
      'files': { name: 'Files', icon: FolderOpen },
      'settings': { name: 'Settings', icon: Settings },
    }
    
    return pageMap[page] || { name: page, icon: Home }
  }
  
  const currentPageInfo = getPageInfo(currentPage)
  const CurrentIcon = currentPageInfo.icon

  return (
    <div className="mb-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard" className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                Lab Selection
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/dashboard/labs/${lab.id}`} className="flex items-center gap-1">
                <FlaskConical className="h-4 w-4" />
                {lab.name}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {currentPage !== lab.id && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="flex items-center gap-1">
                  <CurrentIcon className="h-4 w-4" />
                  {currentPageInfo.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}