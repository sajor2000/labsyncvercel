import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Clock, Users } from "lucide-react";
import { format, addHours } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

interface CalendarEventCreatorProps {
  labId: string;
  onEventCreated?: () => void;
  defaultDate?: Date;
  defaultTitle?: string;
}

export function CalendarEventCreator({ 
  labId, 
  onEventCreated, 
  defaultDate, 
  defaultTitle 
}: CalendarEventCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: defaultTitle || '',
    description: '',
    eventType: 'MEETING' as const,
    startDate: defaultDate || new Date(),
    duration: 1,
    allDay: false,
    location: '',
    autoSyncToGoogle: true,
    color: '#4C9A92'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const endDate = new Date(eventData.startDate.getTime() + (eventData.duration * 60 * 60 * 1000));
      
      return apiRequest('/api/google-calendar/events', {
        method: 'POST',
        body: {
          ...eventData,
          endDate,
          labId,
          categoryPrefix: `[${eventData.eventType}]`,
          exportTitle: `[${eventData.eventType}] ${eventData.title}`,
          exportDescription: `${eventData.description}\n\nCreated via LabSync Calendar`
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Calendar Event Created",
        description: `Event "${formData.title}" has been created${formData.autoSyncToGoogle ? ' and synced to Google Calendar' : ''}.`,
      });
      
      // Reset form
      setFormData({
        title: defaultTitle || '',
        description: '',
        eventType: 'MEETING',
        startDate: defaultDate || new Date(),
        duration: 1,
        allDay: false,
        location: '',
        autoSyncToGoogle: true,
        color: '#4C9A92'
      });
      
      setIsOpen(false);
      onEventCreated?.();
      
      // Invalidate calendar queries
      queryClient.invalidateQueries({ queryKey: ['/api/google-calendar/events'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Event",
        description: error.message || "Could not create calendar event",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for the event",
        variant: "destructive",
      });
      return;
    }
    
    createEventMutation.mutate(formData);
  };

  const eventTypeOptions = [
    { value: 'MEETING', label: 'Meeting', color: '#3b82f6' },
    { value: 'CLINICAL_SERVICE', label: 'Clinical Service', color: '#059669' },
    { value: 'PTO', label: 'PTO', color: '#dc2626' },
    { value: 'TRAINING', label: 'Training', color: '#7c3aed' },
    { value: 'CONFERENCE', label: 'Conference', color: '#ea580c' },
    { value: 'OTHER', label: 'Other', color: '#6b7280' }
  ];

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="w-full"
        data-testid="button-create-calendar-event"
      >
        <CalendarIcon className="h-4 w-4 mr-2" />
        Create Calendar Event
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Create Calendar Event
        </CardTitle>
        <CardDescription>
          Add a new event to your LabSync calendar with automatic Google Calendar sync
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                placeholder="Enter event title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                data-testid="input-event-title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type</Label>
              <Select 
                value={formData.eventType} 
                onValueChange={(value) => {
                  const selectedType = eventTypeOptions.find(opt => opt.value === value);
                  setFormData(prev => ({ 
                    ...prev, 
                    eventType: value as any,
                    color: selectedType?.color || '#4C9A92'
                  }));
                }}
              >
                <SelectTrigger data-testid="select-event-type">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: option.color }}
                        />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Event description or agenda"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              data-testid="textarea-event-description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date & Time</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    data-testid="button-select-date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.startDate, "PPP 'at' p")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, startDate: date }))}
                    initialFocus
                  />
                  <div className="p-3 border-t">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={format(formData.startDate, "HH:mm")}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':').map(Number);
                        const newDate = new Date(formData.startDate);
                        newDate.setHours(hours, minutes);
                        setFormData(prev => ({ ...prev, startDate: newDate }));
                      }}
                      data-testid="input-event-time"
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (hours)</Label>
              <Select 
                value={formData.duration.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, duration: parseFloat(value) }))}
              >
                <SelectTrigger data-testid="select-event-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">30 minutes</SelectItem>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="1.5">1.5 hours</SelectItem>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="3">3 hours</SelectItem>
                  <SelectItem value="4">4 hours</SelectItem>
                  <SelectItem value="8">All day (8 hours)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (optional)</Label>
            <Input
              id="location"
              placeholder="Meeting room, Zoom link, etc."
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              data-testid="input-event-location"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="autoSyncToGoogle"
                checked={formData.autoSyncToGoogle}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoSyncToGoogle: checked }))}
                data-testid="switch-auto-sync"
              />
              <Label htmlFor="autoSyncToGoogle" className="text-sm">
                Auto-sync to Google Calendar
              </Label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              disabled={createEventMutation.isPending}
              className="flex-1"
              data-testid="button-create-event"
            >
              {createEventMutation.isPending ? 'Creating...' : 'Create Event'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              data-testid="button-cancel-event"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}