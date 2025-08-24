"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Check, ChevronsUpDown, Plus, Search, Building2, Users, Beaker } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

interface Lab {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  created_at: string
  is_active: boolean
  metadata: any
  _count?: {
    members: number
    studies: number
    buckets: number
  }
  current_member_role?: string
}

export function LabSwitcher() {
  const [open, setOpen] = useState(false)
  const [labs, setLabs] = useState<Lab[]>([])
  const [currentLabId, setCurrentLabId] = useState<string | null>(null)
  const [currentLab, setCurrentLab] = useState<Lab | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchLabs()
    getCurrentLab()
  }, [])

  const fetchLabs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get all labs the user is a member of
      const { data: memberships, error: membershipError } = await supabase
        .from("lab_members")
        .select(`
          lab_id,
          role,
          labs (
            id,
            name,
            description,
            logo_url,
            created_at,
            is_active,
            metadata
          )
        `)
        .eq("user_id", user.id)
        .eq("is_active", true)

      if (membershipError) throw membershipError

      // Transform the data to include member role and counts
      const labsData = memberships?.map(m => ({
        ...m.labs,
        current_member_role: m.role
      })) || []

      // Fetch counts for each lab (in a real app, this might be optimized)
      const labsWithCounts = await Promise.all(
        labsData.map(async (lab) => {
          // Get member count
          const { count: memberCount } = await supabase
            .from("lab_members")
            .select("*", { count: "exact", head: true })
            .eq("lab_id", (lab as any).id)
            .eq("is_active", true)

          // Get study count
          const { count: studyCount } = await supabase
            .from("projects")
            .select("*", { count: "exact", head: true })
            .eq("lab_id", (lab as any).id)

          // Get bucket count
          const { count: bucketCount } = await supabase
            .from("project_buckets")
            .select("*", { count: "exact", head: true })
            .eq("lab_id", (lab as any).id)
            .eq("is_active", true)

          return {
            ...lab,
            _count: {
              members: memberCount || 0,
              studies: studyCount || 0,
              buckets: bucketCount || 0
            }
          }
        })
      )

      setLabs(labsWithCounts as any)
    } catch (error) {
      console.error("Error fetching labs:", error)
      toast.error("Failed to load labs")
    } finally {
      setLoading(false)
    }
  }

  const getCurrentLab = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get current lab from user profile
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("last_selected_lab_id")
        .eq("id", user.id)
        .single()

      if (profile?.last_selected_lab_id) {
        setCurrentLabId(profile.last_selected_lab_id)
        
        // Fetch full lab details
        const { data: lab } = await supabase
          .from("labs")
          .select("*")
          .eq("id", profile.last_selected_lab_id)
          .single()
          
        if (lab) {
          setCurrentLab(lab as Lab)
        }
      } else {
        // Set first available lab as current
        if (labs.length > 0) {
          await switchLab(labs[0].id)
        }
      }
    } catch (error) {
      console.error("Error getting current lab:", error)
    }
  }

  const switchLab = async (labId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Update user profile with new current lab
      const { error } = await supabase
        .from("user_profiles")
        .update({ last_selected_lab_id: labId })
        .eq("id", user.id)

      if (error) throw error

      // Update local state
      setCurrentLabId(labId)
      const selectedLab = labs.find(l => l.id === labId)
      if (selectedLab) {
        setCurrentLab(selectedLab)
      }

      // Store in localStorage for persistence
      localStorage.setItem("current_lab_id", labId)

      toast.success(`Switched to ${selectedLab?.name}`)
      
      // Refresh the page to update all components
      router.refresh()
      setOpen(false)
    } catch (error) {
      console.error("Error switching lab:", error)
      toast.error("Failed to switch lab")
    }
  }

  const filteredLabs = labs.filter(lab =>
    lab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lab.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getLabInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={false}
        className="w-[240px] justify-between"
        disabled
      >
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-pulse bg-muted rounded" />
          <span className="animate-pulse bg-muted rounded h-4 w-20" />
        </div>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a lab"
          className="w-[240px] justify-between"
        >
          <div className="flex items-center gap-2 truncate">
            {currentLab ? (
              <>
                <Avatar className="h-5 w-5">
                  <AvatarImage src={currentLab.logo_url || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {getLabInitials(currentLab.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{currentLab.name}</span>
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              </>
            ) : (
              <span className="text-muted-foreground">Select a lab...</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="Search labs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList>
            {filteredLabs.length === 0 ? (
              <CommandEmpty>No labs found.</CommandEmpty>
            ) : (
              <CommandGroup heading="Your Labs">
                {filteredLabs.map((lab) => (
                  <CommandItem
                    key={(lab as any).id}
                    value={(lab as any).id}
                    onSelect={() => switchLab((lab as any).id)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={lab.logo_url || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {getLabInitials(lab.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{lab.name}</span>
                          {lab.current_member_role && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              {lab.current_member_role}
                            </Badge>
                          )}
                        </div>
                        {lab.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {lab.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{lab._count?.members || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Beaker className="h-3 w-3" />
                            <span>{lab._count?.studies || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            <span>{lab._count?.buckets || 0}</span>
                          </div>
                        </div>
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          currentLabId === (lab as any).id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false)
                  router.push("/dashboard/labs")
                }}
                className="cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Lab
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  setOpen(false)
                  router.push("/dashboard/labs")
                }}
                className="cursor-pointer"
              >
                <Building2 className="mr-2 h-4 w-4" />
                View All Labs
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}