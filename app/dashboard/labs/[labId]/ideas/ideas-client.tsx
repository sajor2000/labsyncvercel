"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Lightbulb, 
  Plus, 
  Search, 
  ArrowLeft, 
  ThumbsUp, 
  ThumbsDown,
  User,
  Target,
  Zap,
  Clock,
  CheckCircle2
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"

interface Idea {
  id: string
  title: string
  description: string | null
  category: string
  status: string
  effort_level: string
  impact_level: string
  tags: string[] | null
  submitted_by: string
  implementation_notes: string | null
  feedback: string | null
  created_at: string
  updated_at: string
  upvotes: number
  downvotes: number
  score: number
}

interface UserVote {
  idea_id: string
  vote_type: string
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

interface IdeasPageClientProps {
  lab: Lab
  initialIdeas: Idea[]
  userVotes: UserVote[]
  labMembers: LabMember[]
  currentUserId: string
  userPermissions: {
    canCreate: boolean
    canModerate: boolean
  }
}

const statusColors = {
  'draft': 'bg-gray-500',
  'proposed': 'bg-blue-500',
  'under_review': 'bg-yellow-500',
  'approved': 'bg-green-500',
  'in_progress': 'bg-purple-500',
  'implemented': 'bg-emerald-500',
  'rejected': 'bg-red-500',
  'archived': 'bg-gray-600'
}

const categoryColors = {
  'research': 'bg-blue-500',
  'process_improvement': 'bg-green-500',
  'technology': 'bg-purple-500',
  'collaboration': 'bg-orange-500',
  'training': 'bg-teal-500',
  'equipment': 'bg-red-500',
  'other': 'bg-gray-500'
}

const effortColors = {
  'low': 'bg-green-600',
  'medium': 'bg-yellow-600',
  'high': 'bg-red-600'
}

const impactColors = {
  'low': 'bg-gray-600',
  'medium': 'bg-blue-600',
  'high': 'bg-purple-600'
}

export default function IdeasPageClient({ 
  lab, 
  initialIdeas,
  userVotes,
  labMembers,
  currentUserId,
  userPermissions 
}: IdeasPageClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [ideas, setIdeas] = useState<Idea[]>(initialIdeas)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("recent")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'research',
    effort_level: 'medium',
    impact_level: 'medium',
    tags: ''
  })

  const getUserVote = (ideaId: string) => {
    return userVotes.find(vote => vote.idea_id === ideaId)?.vote_type || null
  }

  const getMemberName = (userId: string) => {
    const member = labMembers.find(m => m.user_id === userId)
    if (!member || !member.user_profiles) return 'Unknown'
    
    const profile = member.user_profiles
    return profile.full_name || 
           `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
           profile.email || 'Unknown'
  }

  const handleVote = async (ideaId: string, voteType: 'upvote' | 'downvote') => {
    try {
      const currentVote = getUserVote(ideaId)
      
      if (currentVote === voteType) {
        // Remove vote if clicking same vote
        const { error } = await supabase
          .from('idea_votes')
          .delete()
          .eq('idea_id', ideaId)
          .eq('user_id', currentUserId)
        
        if (error) throw error
        
        // Update local state
        setIdeas(prev => prev.map(idea => {
          if (idea.id === ideaId) {
            const newVotes = voteType === 'upvote' 
              ? { upvotes: idea.upvotes - 1, downvotes: idea.downvotes }
              : { upvotes: idea.upvotes, downvotes: idea.downvotes - 1 }
            return { ...idea, ...newVotes, score: newVotes.upvotes - newVotes.downvotes }
          }
          return idea
        }))
        
      } else {
        // Add or change vote
        const { error } = await supabase
          .from('idea_votes')
          .upsert({
            idea_id: ideaId,
            user_id: currentUserId,
            vote_type: voteType
          })
        
        if (error) throw error
        
        // Update local state
        setIdeas(prev => prev.map(idea => {
          if (idea.id === ideaId) {
            let newVotes
            if (currentVote) {
              // Changing vote
              newVotes = currentVote === 'upvote'
                ? { upvotes: idea.upvotes - 1, downvotes: idea.downvotes + 1 }
                : { upvotes: idea.upvotes + 1, downvotes: idea.downvotes - 1 }
            } else {
              // New vote
              newVotes = voteType === 'upvote' 
                ? { upvotes: idea.upvotes + 1, downvotes: idea.downvotes }
                : { upvotes: idea.upvotes, downvotes: idea.downvotes + 1 }
            }
            return { ...idea, ...newVotes, score: newVotes.upvotes - newVotes.downvotes }
          }
          return idea
        }))
      }
      
    } catch (error: any) {
      console.error('Error voting:', error)
      toast.error('Failed to vote')
    }
  }

  const handleCreateIdea = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    setIsLoading(true)
    try {
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      
      const { data, error } = await supabase
        .from('ideas')
        .insert({
          lab_id: lab.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          category: formData.category,
          effort_level: formData.effort_level,
          impact_level: formData.impact_level,
          tags: tags.length > 0 ? tags : null,
          submitted_by: currentUserId,
          status: 'proposed'
        })
        .select()
        .single()

      if (error) throw error

      const newIdea = { ...data, upvotes: 0, downvotes: 0, score: 0 }
      setIdeas(prev => [newIdea, ...prev])
      
      setFormData({
        title: '',
        description: '',
        category: 'research',
        effort_level: 'medium',
        impact_level: 'medium',
        tags: ''
      })
      setIsCreateDialogOpen(false)
      toast.success('Idea submitted successfully!')
      
    } catch (error: any) {
      console.error('Error creating idea:', error)
      toast.error('Failed to submit idea')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredAndSortedIdeas = ideas
    .filter(idea => {
      const matchesSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (idea.description && idea.description.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesStatus = filterStatus === "all" || idea.status === filterStatus
      const matchesCategory = filterCategory === "all" || idea.category === filterCategory
      
      return matchesSearch && matchesStatus && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'score': return b.score - a.score
        case 'recent': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'impact': return b.impact_level.localeCompare(a.impact_level)
        default: return 0
      }
    })

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
              {lab.name} - Research Ideas
            </h1>
            <p className="text-muted-foreground">
              Collaborate on research ideas and innovations for your lab
            </p>
          </div>
        </div>
        
        {userPermissions.canCreate && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-slack-primary">
                <Plus className="h-4 w-4 mr-2" />
                Submit Idea
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Submit New Research Idea</DialogTitle>
                <DialogDescription>
                  Share your research idea with {lab.name} for collaboration and feedback
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateIdea} className="space-y-4">
                <div>
                  <Label htmlFor="idea-title">Idea Title</Label>
                  <Input
                    id="idea-title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., AI-powered patient outcome prediction"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="idea-category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="research">Research</SelectItem>
                      <SelectItem value="process_improvement">Process Improvement</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="collaboration">Collaboration</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="effort-level">Effort Level</Label>
                    <Select 
                      value={formData.effort_level} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, effort_level: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="impact-level">Impact Level</Label>
                    <Select 
                      value={formData.impact_level} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, impact_level: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="e.g., machine learning, clinical trials, data analysis"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your idea, potential benefits, implementation approach..."
                    rows={4}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Submitting...' : 'Submit Idea'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ideas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="research">Research</SelectItem>
            <SelectItem value="process_improvement">Process Improvement</SelectItem>
            <SelectItem value="technology">Technology</SelectItem>
            <SelectItem value="collaboration">Collaboration</SelectItem>
            <SelectItem value="training">Training</SelectItem>
            <SelectItem value="equipment">Equipment</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="proposed">Proposed</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="implemented">Implemented</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="score">Highest Voted</SelectItem>
            <SelectItem value="impact">Highest Impact</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ideas Grid */}
      {filteredAndSortedIdeas.length === 0 ? (
        <Card className="card-slack p-12 text-center">
          <Lightbulb className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium text-foreground mb-2">
            {ideas.length === 0 ? 'No Ideas Yet' : 'No Matching Ideas'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {ideas.length === 0 
              ? 'Start collaborating by submitting your first research idea'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          {userPermissions.canCreate && ideas.length === 0 && (
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="btn-slack-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Submit First Idea
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedIdeas.map((idea) => {
            const userVote = getUserVote(idea.id)
            
            return (
              <Card key={idea.id} className="card-slack hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge 
                          variant="outline"
                          className={`text-xs text-white ${categoryColors[idea.category as keyof typeof categoryColors] || 'bg-gray-500'}`}
                        >
                          {idea.category.replace('_', ' ')}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={`text-xs text-white ${statusColors[idea.status as keyof typeof statusColors] || 'bg-gray-500'}`}
                        >
                          {idea.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg leading-tight line-clamp-2">
                        {idea.title}
                      </CardTitle>
                    </div>
                    
                    {/* Voting Controls */}
                    <div className="flex flex-col items-center space-y-1 ml-3">
                      <Button
                        size="sm"
                        variant={userVote === 'upvote' ? 'default' : 'outline'}
                        onClick={() => handleVote(idea.id, 'upvote')}
                        className="h-8 w-8 p-0"
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <span className={`text-sm font-medium ${
                        idea.score > 0 ? 'text-green-400' : 
                        idea.score < 0 ? 'text-red-400' : 
                        'text-muted-foreground'
                      }`}>
                        {idea.score > 0 ? '+' : ''}{idea.score}
                      </span>
                      <Button
                        size="sm"
                        variant={userVote === 'downvote' ? 'default' : 'outline'}
                        onClick={() => handleVote(idea.id, 'downvote')}
                        className="h-8 w-8 p-0"
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {idea.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {idea.description}
                    </p>
                  )}

                  {/* Effort and Impact Indicators */}
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <Zap className="h-3 w-3 text-muted-foreground" />
                      <Badge 
                        variant="outline" 
                        className={`text-xs text-white ${effortColors[idea.effort_level as keyof typeof effortColors]}`}
                      >
                        {idea.effort_level} effort
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Target className="h-3 w-3 text-muted-foreground" />
                      <Badge 
                        variant="outline" 
                        className={`text-xs text-white ${impactColors[idea.impact_level as keyof typeof impactColors]}`}
                      >
                        {idea.impact_level} impact
                      </Badge>
                    </div>
                  </div>

                  {/* Tags */}
                  {idea.tags && idea.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {idea.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                      {idea.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{idea.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>{getMemberName(idea.submitted_by)}</span>
                    </div>
                    <span>{format(new Date(idea.created_at), 'MMM d, yyyy')}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => router.push(`/dashboard/labs/${lab.id}/ideas/${idea.id}`)}
                      className="flex-1"
                    >
                      View Details
                    </Button>
                    {idea.status === 'approved' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => router.push(`/dashboard/labs/${lab.id}/projects/new?idea=${idea.id}`)}
                        className="text-green-400 border-green-600"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Start Project
                      </Button>
                    )}
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