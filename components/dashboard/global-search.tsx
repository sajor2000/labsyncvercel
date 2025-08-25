"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, FileText, Beaker, FolderOpen, CheckSquare, Lightbulb, Calendar } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
// Simple debounce implementation
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

interface SearchResult {
  id: string
  title: string
  type: 'study' | 'task' | 'idea' | 'deadline' | 'bucket' | 'file'
  description?: string
  lab_id: string
  url: string
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Debounced search function
  const performSearch = useCallback(
    debounce(async (query: string) => {
      if (!query || query.length < 2) {
        setResults([])
        return
      }

      setLoading(true)
      const searchResults: SearchResult[] = []

      try {
        // Get current user's labs
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: userLabs } = await supabase
          .from('lab_members')
          .select('lab_id')
          .eq('user_id', user.id)

        const labIds = userLabs?.map(l => l.lab_id) || []

        // Search projects (formerly studies)
        const { data: projects } = await supabase
          .from('projects')
          .select('id, name, description, bucket_id, buckets!inner(lab_id)')
          .ilike('name', `%${query}%`)
          .limit(5)

        projects?.forEach(project => {
          searchResults.push({
            id: project.id,
            title: project.name,
            type: 'study' as const,
            description: project.description,
            lab_id: Array.isArray((project as any).buckets) ? (project as any).buckets[0]?.lab_id : (project as any).buckets?.lab_id,
            url: `/dashboard/projects/${project.id}`
          })
        })

        // Search tasks
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, title, description, project_id, projects!inner(bucket_id, buckets!inner(lab_id))')
          .ilike('title', `%${query}%`)
          .limit(5)

        tasks?.forEach(task => {
          searchResults.push({
            id: task.id,
            title: task.title,
            type: 'task',
            description: task.description,
            lab_id: Array.isArray((task as any).projects) ? (task as any).projects[0]?.buckets?.lab_id : (Array.isArray((task as any).projects?.buckets) ? (task as any).projects.buckets[0]?.lab_id : (task as any).projects?.buckets?.lab_id),
            url: `/dashboard/tasks/${task.id}`
          })
        })

        // Search project buckets
        const { data: buckets } = await supabase
          .from('buckets')
          .select('id, name, description, lab_id')
          .in('lab_id', labIds)
          .ilike('name', `%${query}%`)
          .limit(5)

        buckets?.forEach(bucket => {
          searchResults.push({
            id: bucket.id,
            title: bucket.name,
            type: 'bucket',
            description: bucket.description,
            lab_id: bucket.lab_id,
            url: `/dashboard/buckets?highlight=${bucket.id}`
          })
        })

        // Search ideas
        const { data: ideas } = await supabase
          .from('ideas')
          .select('id, title, description, lab_id')
          .in('lab_id', labIds)
          .ilike('title', `%${query}%`)
          .limit(5)

        ideas?.forEach(idea => {
          searchResults.push({
            id: idea.id,
            title: idea.title,
            type: 'idea',
            description: idea.description,
            lab_id: idea.lab_id,
            url: `/dashboard/ideas/${idea.id}`
          })
        })

        // Search deadlines
        const { data: deadlines } = await supabase
          .from('deadlines')
          .select('id, title, description, lab_id')
          .in('lab_id', labIds)
          .ilike('title', `%${query}%`)
          .limit(5)

        deadlines?.forEach(deadline => {
          searchResults.push({
            id: deadline.id,
            title: deadline.title,
            type: 'deadline',
            description: deadline.description,
            lab_id: deadline.lab_id,
            url: `/dashboard/deadlines/${deadline.id}`
          })
        })

        setResults(searchResults)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }, 300),
    []
  )

  useEffect(() => {
    performSearch(search)
  }, [search, performSearch])

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSelect = (result: SearchResult) => {
    router.push(result.url)
    setOpen(false)
    setSearch('')
    setResults([])
  }

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'study':
        return <Beaker className="w-4 h-4" />
      case 'task':
        return <CheckSquare className="w-4 h-4" />
      case 'bucket':
        return <FolderOpen className="w-4 h-4" />
      case 'idea':
        return <Lightbulb className="w-4 h-4" />
      case 'deadline':
        return <Calendar className="w-4 h-4" />
      case 'file':
        return <FileText className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'study':
        return 'Study'
      case 'task':
        return 'Task'
      case 'bucket':
        return 'Bucket'
      case 'idea':
        return 'Idea'
      case 'deadline':
        return 'Deadline'
      case 'file':
        return 'File'
      default:
        return ''
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
      >
        <Search className="w-4 h-4" />
        <span>Search...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-gray-600 bg-gray-700 px-1.5 font-mono text-[10px] font-medium text-gray-400">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search studies, tasks, ideas, deadlines..." 
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          {loading && (
            <CommandEmpty>Searching...</CommandEmpty>
          )}
          {!loading && search && results.length === 0 && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}
          {!loading && !search && (
            <CommandEmpty>Start typing to search...</CommandEmpty>
          )}
          {results.length > 0 && (
            <>
              {['study', 'task', 'bucket', 'idea', 'deadline'].map(type => {
                const typeResults = results.filter(r => r.type === type)
                if (typeResults.length === 0) return null

                return (
                  <CommandGroup key={type} heading={getTypeLabel(type as any) + 's'}>
                    {typeResults.map((result) => (
                      <CommandItem
                        key={result.id}
                        value={result.title}
                        onSelect={() => handleSelect(result)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        {getIcon(result.type)}
                        <div className="flex-1">
                          <div className="font-medium">{result.title}</div>
                          {result.description && (
                            <div className="text-xs text-gray-500 line-clamp-1">
                              {result.description}
                            </div>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )
              })}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}