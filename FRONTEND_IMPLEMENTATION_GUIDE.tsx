// FRONTEND IMPLEMENTATION GUIDE - Complete CRUD with Delete Confirmations
// Matches FINAL_SCHEMA_FIXED.sql exactly

import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

// ============================================
// DELETE CONFIRMATION SYSTEM
// ============================================

interface DeleteConfirmationProps {
  entity: string;
  entityName: string;
  warningLevel: 'critical' | 'high' | 'medium' | 'low';
  cascadeInfo?: {
    tables: string[];
    counts: Record<string, number>;
  };
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function DeleteConfirmationDialog({
  entity,
  entityName,
  warningLevel,
  cascadeInfo,
  onConfirm,
  onCancel
}: DeleteConfirmationProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const requiresTyping = warningLevel === 'critical';
  const canDelete = !requiresTyping || confirmText === entityName;
  
  const warningColors = {
    critical: 'bg-red-500 border-red-600',
    high: 'bg-orange-500 border-orange-600',
    medium: 'bg-yellow-500 border-yellow-600',
    low: 'bg-blue-500 border-blue-600'
  };
  
  const handleDelete = async () => {
    if (!canDelete) return;
    
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className={`-m-6 mb-4 p-4 ${warningColors[warningLevel]}`}>
          <h2 className="text-white font-bold text-lg">
            ⚠️ Delete {entity}?
          </h2>
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete <strong>{entityName}</strong>?
          </p>
          
          {cascadeInfo && cascadeInfo.counts && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
              <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                This will also delete:
              </p>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                {Object.entries(cascadeInfo.counts).map(([table, count]) => (
                  count > 0 && (
                    <li key={table}>• {count} {table}</li>
                  )
                ))}
              </ul>
            </div>
          )}
          
          {requiresTyping && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Type <strong>{entityName}</strong> to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Type entity name to confirm"
              />
            </div>
          )}
          
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={!canDelete || isDeleting}
              className={`px-4 py-2 text-white rounded ${
                canDelete && !isDeleting
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// UNIVERSAL DELETE HANDLER
// ============================================

export async function handleDelete(
  supabase: any,
  entity: string,
  id: string,
  name: string
) {
  // 1. Get deletion warning configuration
  const { data: warning } = await supabase
    .from('deletion_warnings')
    .select('*')
    .eq('entity_type', entity)
    .single();
  
  // 2. Check cascade dependencies
  const { data: dependencies } = await supabase
    .rpc('check_cascade_dependencies', {
      p_table_name: entity,
      p_entity_id: id
    });
  
  // 3. Build cascade info
  const cascadeInfo = dependencies ? {
    tables: warning?.cascade_tables || [],
    counts: dependencies.reduce((acc: any, dep: any) => {
      acc[dep.dependent_table] = dep.dependent_count;
      return acc;
    }, {})
  } : undefined;
  
  // 4. Return confirmation promise
  return new Promise((resolve, reject) => {
    const confirmDialog = {
      entity,
      entityName: name,
      warningLevel: warning?.warning_level || 'medium',
      cascadeInfo,
      onConfirm: async () => {
        // Use safe_delete function for soft delete
        const { error } = await supabase.rpc('safe_delete', {
          p_table_name: entity,
          p_entity_id: id,
          p_user_id: (await supabase.auth.getUser()).data.user?.id
        });
        
        if (error) {
          reject(error);
        } else {
          resolve(true);
        }
      },
      onCancel: () => reject('User cancelled')
    };
    
    // Show dialog (you'd integrate with your modal system)
    // window.showDeleteConfirmation(confirmDialog); // TODO: Integrate with actual modal system
    console.warn('Delete confirmation dialog not implemented - integrate with your modal system');
  });
}

// ============================================
// LABS CRUD OPERATIONS
// ============================================

export const LabsAPI = {
  // CREATE
  async create(supabase: any, data: {
    name: string;
    description?: string;
    logo_url?: string;
    standup_day?: string;
    standup_time?: string;
    primary_color?: string;
  }) {
    const { data: lab, error } = await supabase
      .from('labs')
      .insert(data)
      .select()
      .single();
    
    if (!error && lab) {
      // Auto-add creator as PI
      await supabase
        .from('lab_members')
        .insert({
          lab_id: lab.id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          role: 'PRINCIPAL_INVESTIGATOR',
          can_manage_lab: true,
          can_manage_members: true
        });
    }
    
    return { data: lab, error };
  },
  
  // READ
  async list(supabase: any) {
    return await supabase
      .from('labs')
      .select(`
        *,
        lab_members!inner(user_id)
      `)
      .is('deleted_at', null)
      .is('is_archived', false);
  },
  
  // UPDATE
  async update(supabase: any, id: string, data: any) {
    return await supabase
      .from('labs')
      .update(data)
      .eq('id', id)
      .select()
      .single();
  },
  
  // DELETE (with confirmation)
  async delete(supabase: any, id: string, name: string) {
    return await handleDelete(supabase, 'labs', id, name);
  },
  
  // ARCHIVE
  async archive(supabase: any, id: string) {
    return await supabase.rpc('archive_entity', {
      p_table_name: 'labs',
      p_entity_id: id,
      p_user_id: (await supabase.auth.getUser()).data.user?.id
    });
  }
};

// ============================================
// BUCKETS CRUD OPERATIONS
// ============================================

export const BucketsAPI = {
  // CREATE
  async create(supabase: any, data: {
    lab_id: string;
    name: string;
    description?: string;
    color?: string;
    position?: number;
  }) {
    return await supabase
      .from('buckets')
      .insert(data)
      .select()
      .single();
  },
  
  // READ
  async list(supabase: any, labId: string) {
    return await supabase
      .from('buckets')
      .select('*')
      .eq('lab_id', labId)
      .is('deleted_at', null)
      .order('position');
  },
  
  // UPDATE
  async update(supabase: any, id: string, data: any) {
    return await supabase
      .from('buckets')
      .update(data)
      .eq('id', id)
      .select()
      .single();
  },
  
  // DELETE (with confirmation)
  async delete(supabase: any, id: string, name: string) {
    return await handleDelete(supabase, 'buckets', id, name);
  }
};

// ============================================
// PROJECTS CRUD OPERATIONS
// ============================================

export const ProjectsAPI = {
  // CREATE
  async create(supabase: any, data: {
    bucket_id: string;
    lab_id: string;
    name: string;
    description?: string;
    start_date?: string;
    due_date?: string;
  }) {
    return await supabase
      .from('projects')
      .insert(data)
      .select()
      .single();
  },
  
  // READ
  async list(supabase: any, bucketId?: string) {
    let query = supabase
      .from('projects')
      .select(`
        *,
        tasks(count)
      `)
      .is('deleted_at', null)
      .is('is_archived', false);
    
    if (bucketId) {
      query = query.eq('bucket_id', bucketId);
    }
    
    return await query.order('created_at', { ascending: false });
  },
  
  // UPDATE
  async update(supabase: any, id: string, data: any) {
    return await supabase
      .from('projects')
      .update(data)
      .eq('id', id)
      .select()
      .single();
  },
  
  // DELETE (with confirmation)
  async delete(supabase: any, id: string, name: string) {
    return await handleDelete(supabase, 'projects', id, name);
  },
  
  // ARCHIVE
  async archive(supabase: any, id: string) {
    return await supabase.rpc('archive_entity', {
      p_table_name: 'projects',
      p_entity_id: id,
      p_user_id: (await supabase.auth.getUser()).data.user?.id
    });
  }
};

// ============================================
// TASKS CRUD OPERATIONS
// ============================================

export const TasksAPI = {
  // CREATE
  async create(supabase: any, data: {
    project_id: string;
    lab_id: string;
    title: string;
    description?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    due_date?: string;
    assigned_to?: string;
    parent_task_id?: string; // For subtasks
  }) {
    return await supabase
      .from('tasks')
      .insert(data)
      .select()
      .single();
  },
  
  // READ
  async list(supabase: any, projectId?: string) {
    let query = supabase
      .from('tasks')
      .select(`
        *,
        assigned_to_user:assigned_to(full_name, avatar_url),
        subtasks:tasks!parent_task_id(count)
      `)
      .is('deleted_at', null);
    
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    
    return await query.order('position');
  },
  
  // UPDATE
  async update(supabase: any, id: string, data: any) {
    return await supabase
      .from('tasks')
      .update(data)
      .eq('id', id)
      .select()
      .single();
  },
  
  // DELETE (with confirmation)
  async delete(supabase: any, id: string, title: string) {
    return await handleDelete(supabase, 'tasks', id, title);
  },
  
  // MOVE (Kanban drag & drop)
  async move(supabase: any, id: string, newStatus: string, newPosition: number) {
    return await supabase
      .from('tasks')
      .update({ 
        status: newStatus,
        position: newPosition 
      })
      .eq('id', id);
  }
};

// ============================================
// DEADLINES CRUD OPERATIONS
// ============================================

export const DeadlinesAPI = {
  // CREATE
  async create(supabase: any, data: {
    lab_id: string;
    title: string;
    description?: string;
    type: string;
    due_date: string;
    assigned_to?: string;
    reminder_days_before?: number[];
  }) {
    return await supabase
      .from('deadlines')
      .insert(data)
      .select()
      .single();
  },
  
  // READ
  async list(supabase: any, labId: string) {
    return await supabase
      .from('deadlines')
      .select(`
        *,
        assigned_to_user:assigned_to(full_name, avatar_url)
      `)
      .eq('lab_id', labId)
      .order('due_date');
  },
  
  async getUpcoming(supabase: any, labId: string) {
    return await supabase
      .from('upcoming_deadlines')
      .select('*')
      .eq('lab_id', labId);
  },
  
  // UPDATE
  async update(supabase: any, id: string, data: any) {
    return await supabase
      .from('deadlines')
      .update(data)
      .eq('id', id)
      .select()
      .single();
  },
  
  // DELETE (with confirmation)
  async delete(supabase: any, id: string, title: string) {
    return await handleDelete(supabase, 'deadlines', id, title);
  },
  
  // COMPLETE
  async complete(supabase: any, id: string) {
    return await supabase
      .from('deadlines')
      .update({ is_completed: true })
      .eq('id', id);
  }
};

// ============================================
// IDEAS CRUD OPERATIONS
// ============================================

export const IdeasAPI = {
  // CREATE
  async create(supabase: any, data: {
    lab_id: string;
    title: string;
    description?: string;
    category?: string;
    priority?: string;
    estimated_effort?: string;
    potential_impact?: string;
  }) {
    const user = (await supabase.auth.getUser()).data.user;
    return await supabase
      .from('ideas')
      .insert({
        ...data,
        created_by: user?.id
      })
      .select()
      .single();
  },
  
  // READ
  async list(supabase: any, labId: string) {
    return await supabase
      .from('ideas')
      .select(`
        *,
        created_by_user:created_by(full_name, avatar_url),
        comments:idea_comments(count)
      `)
      .eq('lab_id', labId)
      .order('created_at', { ascending: false });
  },
  
  async getActive(supabase: any, labId: string) {
    return await supabase
      .from('active_ideas')
      .select('*')
      .eq('lab_id', labId);
  },
  
  // UPDATE
  async update(supabase: any, id: string, data: any) {
    return await supabase
      .from('ideas')
      .update(data)
      .eq('id', id)
      .select()
      .single();
  },
  
  // DELETE (with confirmation)
  async delete(supabase: any, id: string, title: string) {
    return await handleDelete(supabase, 'ideas', id, title);
  }
};

// ============================================
// STANDUP MEETINGS CRUD OPERATIONS
// ============================================

export const StandupMeetingsAPI = {
  // CREATE
  async create(supabase: any, data: {
    lab_id: string;
    meeting_date: string;
    scheduled_time?: string;
    facilitator_id?: string;
  }) {
    return await supabase
      .from('standup_meetings')
      .insert(data)
      .select()
      .single();
  },
  
  // READ
  async list(supabase: any, labId: string) {
    return await supabase
      .from('standup_meetings')
      .select(`
        *,
        facilitator:facilitator_id(full_name, avatar_url),
        standup_action_items(count)
      `)
      .eq('lab_id', labId)
      .order('meeting_date', { ascending: false });
  },
  
  // UPDATE
  async update(supabase: any, id: string, data: any) {
    return await supabase
      .from('standup_meetings')
      .update(data)
      .eq('id', id)
      .select()
      .single();
  },
  
  // DELETE (with confirmation)
  async delete(supabase: any, id: string, date: string) {
    return await handleDelete(supabase, 'standup_meetings', id, `Meeting on ${date}`);
  },
  
  // UPLOAD RECORDING
  async uploadRecording(supabase: any, id: string, recordingUrl: string) {
    return await supabase
      .from('standup_meetings')
      .update({ 
        recording_url: recordingUrl,
        recording_status: 'PROCESSING'
      })
      .eq('id', id);
  }
};

// ============================================
// FILES CRUD OPERATIONS
// ============================================

export const FilesAPI = {
  // CREATE FILE
  async createFile(supabase: any, data: {
    lab_id: string;
    name: string;
    file_url: string;
    file_size: number;
    mime_type: string;
    parent_id?: string;
    project_id?: string;
    task_id?: string;
  }) {
    const user = (await supabase.auth.getUser()).data.user;
    return await supabase
      .from('files')
      .insert({
        ...data,
        type: 'FILE',
        owner_id: user?.id,
        path: data.parent_id ? '' : '/' // Path will be computed
      })
      .select()
      .single();
  },
  
  // CREATE FOLDER
  async createFolder(supabase: any, data: {
    lab_id: string;
    name: string;
    parent_id?: string;
  }) {
    const user = (await supabase.auth.getUser()).data.user;
    return await supabase
      .from('files')
      .insert({
        ...data,
        type: 'FOLDER',
        owner_id: user?.id,
        path: data.parent_id ? '' : '/'
      })
      .select()
      .single();
  },
  
  // READ
  async list(supabase: any, labId: string, parentId?: string) {
    let query = supabase
      .from('files')
      .select(`
        *,
        owner:owner_id(full_name, avatar_url),
        versions:file_versions(count)
      `)
      .eq('lab_id', labId);
    
    if (parentId) {
      query = query.eq('parent_id', parentId);
    } else {
      query = query.is('parent_id', null);
    }
    
    return await query.order('type').order('name');
  },
  
  // UPDATE
  async update(supabase: any, id: string, data: any) {
    return await supabase
      .from('files')
      .update(data)
      .eq('id', id)
      .select()
      .single();
  },
  
  // DELETE (with confirmation - CASCADE WARNING FOR FOLDERS)
  async delete(supabase: any, id: string, name: string) {
    return await handleDelete(supabase, 'files', id, name);
  },
  
  // SHARE
  async share(supabase: any, fileId: string, userId: string, permissions: {
    can_view?: boolean;
    can_edit?: boolean;
    can_delete?: boolean;
    can_share?: boolean;
  }) {
    return await supabase
      .from('file_permissions')
      .insert({
        file_id: fileId,
        user_id: userId,
        ...permissions
      });
  }
};

// ============================================
// CALENDAR EVENTS CRUD OPERATIONS
// ============================================

export const CalendarEventsAPI = {
  // CREATE
  async create(supabase: any, data: {
    lab_id: string;
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    location?: string;
    attendees?: string[];
    project_id?: string;
    task_id?: string;
    deadline_id?: string;
  }) {
    const user = (await supabase.auth.getUser()).data.user;
    return await supabase
      .from('calendar_events')
      .insert({
        ...data,
        organizer_id: user?.id
      })
      .select()
      .single();
  },
  
  // READ
  async list(supabase: any, labId: string, startDate: string, endDate: string) {
    return await supabase
      .from('calendar_events')
      .select(`
        *,
        organizer:organizer_id(full_name, avatar_url),
        project:project_id(name),
        task:task_id(title),
        deadline:deadline_id(title)
      `)
      .eq('lab_id', labId)
      .gte('start_time', startDate)
      .lte('end_time', endDate)
      .order('start_time');
  },
  
  // UPDATE
  async update(supabase: any, id: string, data: any) {
    return await supabase
      .from('calendar_events')
      .update(data)
      .eq('id', id)
      .select()
      .single();
  },
  
  // DELETE (with confirmation)
  async delete(supabase: any, id: string, title: string) {
    return await handleDelete(supabase, 'calendar_events', id, title);
  }
};

// ============================================
// LAB INVITATIONS CRUD OPERATIONS
// ============================================

export const LabInvitationsAPI = {
  // CREATE (INVITE)
  async invite(supabase: any, data: {
    lab_id: string;
    email: string;
    role: string;
    message?: string;
  }) {
    const user = (await supabase.auth.getUser()).data.user;
    return await supabase
      .from('lab_invitations')
      .insert({
        ...data,
        invited_by: user?.id
      })
      .select()
      .single();
  },
  
  // READ
  async list(supabase: any, labId: string) {
    return await supabase
      .from('lab_invitations')
      .select(`
        *,
        invited_by_user:invited_by(full_name, avatar_url)
      `)
      .eq('lab_id', labId)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });
  },
  
  // ACCEPT
  async accept(supabase: any, invitationId: string) {
    const user = (await supabase.auth.getUser()).data.user;
    
    // Get invitation details
    const { data: invitation } = await supabase
      .from('lab_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();
    
    if (invitation) {
      // Update invitation
      await supabase
        .from('lab_invitations')
        .update({
          status: 'ACCEPTED',
          accepted_by: user?.id,
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitationId);
      
      // Add to lab_members
      return await supabase
        .from('lab_members')
        .insert({
          lab_id: invitation.lab_id,
          user_id: user?.id,
          role: invitation.role
        });
    }
  },
  
  // DECLINE
  async decline(supabase: any, invitationId: string) {
    return await supabase
      .from('lab_invitations')
      .update({ status: 'DECLINED' })
      .eq('id', invitationId);
  }
};

// ============================================
// USER PREFERENCES CRUD OPERATIONS
// ============================================

export const UserPreferencesAPI = {
  // GET OR CREATE
  async getOrCreate(supabase: any) {
    const user = (await supabase.auth.getUser()).data.user;
    
    let { data } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user?.id)
      .single();
    
    if (!data) {
      const { data: newPrefs } = await supabase
        .from('user_preferences')
        .insert({ user_id: user?.id })
        .select()
        .single();
      data = newPrefs;
    }
    
    return { data };
  },
  
  // UPDATE
  async update(supabase: any, preferences: any) {
    const user = (await supabase.auth.getUser()).data.user;
    return await supabase
      .from('user_preferences')
      .update(preferences)
      .eq('user_id', user?.id)
      .select()
      .single();
  }
};

// ============================================
// RESTORE DELETED ENTITIES
// ============================================

export const RecoveryAPI = {
  // LIST DELETED ITEMS
  async listDeleted(supabase: any) {
    const user = (await supabase.auth.getUser()).data.user;
    return await supabase
      .from('deletion_metadata')
      .select('*')
      .eq('deleted_by', user?.id)
      .eq('is_recoverable', true)
      .is('recovered_at', null)
      .order('deleted_at', { ascending: false });
  },
  
  // RESTORE
  async restore(supabase: any, deletionId: string) {
    const user = (await supabase.auth.getUser()).data.user;
    return await supabase.rpc('restore_deleted_entity', {
      p_deletion_id: deletionId,
      p_user_id: user?.id
    });
  }
};

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================

export function subscribeToLabChanges(
  supabase: any,
  labId: string,
  callbacks: {
    onTaskChange?: (payload: any) => void;
    onProjectChange?: (payload: any) => void;
    onDeadlineChange?: (payload: any) => void;
  }
) {
  const subscriptions: any[] = [];
  
  // Subscribe to tasks
  if (callbacks.onTaskChange) {
    subscriptions.push(
      supabase
        .channel(`tasks:${labId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `lab_id=eq.${labId}`
        }, callbacks.onTaskChange)
        .subscribe()
    );
  }
  
  // Subscribe to projects
  if (callbacks.onProjectChange) {
    subscriptions.push(
      supabase
        .channel(`projects:${labId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `lab_id=eq.${labId}`
        }, callbacks.onProjectChange)
        .subscribe()
    );
  }
  
  // Subscribe to deadlines
  if (callbacks.onDeadlineChange) {
    subscriptions.push(
      supabase
        .channel(`deadlines:${labId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'deadlines',
          filter: `lab_id=eq.${labId}`
        }, callbacks.onDeadlineChange)
        .subscribe()
    );
  }
  
  // Return unsubscribe function
  return () => {
    subscriptions.forEach(sub => supabase.removeChannel(sub));
  };
}

// ============================================
// ERROR HANDLING
// ============================================

export function handleSupabaseError(error: any) {
  const errorMessages: Record<string, string> = {
    '23505': 'This item already exists',
    '23503': 'Cannot delete - other items depend on this',
    '23514': 'Invalid data provided',
    '23502': 'Required field is missing',
    '42501': 'You do not have permission for this action',
    '42P01': 'Database table not found',
    'PGRST301': 'No data found',
    'PGRST204': 'No rows returned'
  };
  
  const message = errorMessages[error.code] || error.message || 'An error occurred';
  
  // Show toast or alert
  console.error('Supabase Error:', error);
  alert(message); // Replace with your toast system
  
  return message;
}

// ============================================
// USAGE EXAMPLE COMPONENT
// ============================================

export function ExampleTaskList({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState<any>(null);
  const supabase = createClient('YOUR_URL', 'YOUR_ANON_KEY');
  
  // Load tasks
  useEffect(() => {
    loadTasks();
    
    // Subscribe to realtime changes
    const unsubscribe = subscribeToLabChanges(
      supabase,
      'lab-id-here',
      {
        onTaskChange: (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t => 
              t.id === payload.new.id ? payload.new : t
            ));
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      }
    );
    
    return () => unsubscribe();
  }, [projectId]);
  
  async function loadTasks() {
    const { data, error } = await TasksAPI.list(supabase, projectId);
    if (error) {
      handleSupabaseError(error);
    } else {
      setTasks(data || []);
    }
  }
  
  async function handleCreateTask() {
    const { data, error } = await TasksAPI.create(supabase, {
      project_id: projectId,
      lab_id: 'lab-id-here',
      title: 'New Task',
      priority: 'MEDIUM'
    });
    
    if (error) {
      handleSupabaseError(error);
    }
  }
  
  async function handleDeleteTask(task: any) {
    // Check for subtasks
    const hasSubtasks = task.subtasks?.[0]?.count > 0;
    
    setShowDeleteDialog({
      entity: 'tasks',
      entityName: task.title,
      warningLevel: hasSubtasks ? 'medium' : 'low',
      cascadeInfo: hasSubtasks ? {
        tables: ['subtasks', 'comments'],
        counts: { subtasks: task.subtasks[0].count }
      } : undefined,
      onConfirm: async () => {
        try {
          await TasksAPI.delete(supabase, task.id, task.title);
          setShowDeleteDialog(null);
          loadTasks();
        } catch (error) {
          handleSupabaseError(error);
        }
      },
      onCancel: () => setShowDeleteDialog(null)
    });
  }
  
  return (
    <div>
      <button onClick={handleCreateTask}>Add Task</button>
      
      {tasks.map(task => (
        <div key={task.id}>
          <span>{task.title}</span>
          <button onClick={() => handleDeleteTask(task)}>Delete</button>
        </div>
      ))}
      
      {showDeleteDialog && (
        <DeleteConfirmationDialog {...showDeleteDialog} />
      )}
    </div>
  );
}