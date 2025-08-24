'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { KanbanBoard } from '@/components/dashboard/kanban-board'
import { useBuckets, useStudies } from '@/lib/hooks/use-hierarchy'
import { useUser } from '@/lib/hooks/use-user'
import { Loader2, FolderKanban, BookOpen, Layout, List, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function TaskManagementPage() {
  const searchParams = useSearchParams()
  const { user, loading: userLoading } = useUser()
  const [selectedBucket, setSelectedBucket] = useState<string>('')
  const [selectedStudy, setSelectedStudy] = useState<string>('')
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  
  // Get lab_id from user's current lab
  const lab_id = user?.last_selected_lab_id || ''
  
  // Fetch buckets and studies
  const { buckets, loading: bucketsLoading } = useBuckets(lab_id)
  const { studies, loading: studiesLoading } = useStudies(selectedBucket)
  
  // Set initial selections from URL params
  useEffect(() => {
    const bucket = searchParams.get('bucket')
    const study = searchParams.get('study')
    
    if (bucket) setSelectedBucket(bucket)
    if (study) setSelectedStudy(study)
  }, [searchParams])
  
  // Auto-select first bucket if none selected
  useEffect(() => {
    if (buckets.length > 0 && !selectedBucket) {
      setSelectedBucket(buckets[0].id)
    }
  }, [buckets, selectedBucket])
  
  // Auto-select first study if none selected
  useEffect(() => {
    if (studies.length > 0 && !selectedStudy) {
      setSelectedStudy(studies[0].id)
    }
  }, [studies, selectedStudy])
  
  const selectedBucketData = buckets.find(b => b.id === selectedBucket)
  const selectedStudyData = studies.find(s => s.id === selectedStudy)
  
  if (userLoading || bucketsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }
  
  if (!lab_id) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">No lab selected</p>
        <Button>Select a Lab</Button>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Task Management</h1>
              <p className="text-muted-foreground">
                Manage tasks across your research projects
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Layout className="h-4 w-4 mr-2" />
                Board Settings
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </div>
          </div>
          
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/tasks">Tasks</BreadcrumbLink>
              </BreadcrumbItem>
              {selectedBucketData && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{selectedBucketData.name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
              {selectedStudyData && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{selectedStudyData.name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        
        {/* Selectors */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedBucket} onValueChange={setSelectedBucket}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select a bucket" />
                </SelectTrigger>
                <SelectContent>
                  {buckets.map(bucket => (
                    <SelectItem key={bucket.id} value={bucket.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{bucket.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {bucket._count?.projects || 0}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                  {buckets.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground">
                      No buckets found
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <Select 
                value={selectedStudy} 
                onValueChange={setSelectedStudy}
                disabled={!selectedBucket || studiesLoading}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a study" />
                </SelectTrigger>
                <SelectContent>
                  {studies.map(study => (
                    <SelectItem key={study.id} value={study.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{study.name}</span>
                        <div className="flex items-center gap-2 ml-2">
                          {study.priority && (
                            <Badge variant="outline" className="text-xs">
                              {study.priority}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {study._count?.tasks || 0} tasks
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                  {studies.length === 0 && selectedBucket && (
                    <div className="p-2 text-sm text-muted-foreground">
                      No studies in this bucket
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="ml-auto">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                <TabsList>
                  <TabsTrigger value="kanban">
                    <Layout className="h-4 w-4 mr-2" />
                    Kanban
                  </TabsTrigger>
                  <TabsTrigger value="list">
                    <List className="h-4 w-4 mr-2" />
                    List
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          {/* Study Info */}
          {selectedStudyData && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{selectedStudyData.name}</h3>
                  {selectedStudyData.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedStudyData.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant={
                      selectedStudyData.status === 'completed' ? 'default' :
                      selectedStudyData.status === 'active' ? 'secondary' :
                      'outline'
                    }>
                      {selectedStudyData.status}
                    </Badge>
                    {selectedStudyData.start_date && (
                      <span className="text-xs text-muted-foreground">
                        Started: {new Date(selectedStudyData.start_date).toLocaleDateString()}
                      </span>
                    )}
                    {selectedStudyData.due_date && (
                      <span className="text-xs text-muted-foreground">
                        Due: {new Date(selectedStudyData.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  {selectedStudyData.completion_percentage !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {selectedStudyData.completion_percentage}% Complete
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{selectedStudyData._count?.tasks || 0} tasks</span>
                    <span>•</span>
                    <span>{selectedStudyData._count?.completed_tasks || 0} completed</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {selectedStudy ? (
          viewMode === 'kanban' ? (
            <KanbanBoard
              study_id={selectedStudy}
              lab_id={lab_id}
              className="h-full"
            />
          ) : (
            <div className="p-6">
              <Card>
                <CardHeader>
                  <CardTitle>List View</CardTitle>
                  <CardDescription>
                    Table view of tasks coming soon
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* TODO: Implement list/table view */}
                  <p className="text-muted-foreground">
                    List view with sorting, filtering, and bulk operations will be implemented here.
                  </p>
                </CardContent>
              </Card>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              {selectedBucket ? 'Select a study to view tasks' : 'Select a bucket and study to get started'}
            </p>
            {selectedBucket && studies.length === 0 && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Study
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}