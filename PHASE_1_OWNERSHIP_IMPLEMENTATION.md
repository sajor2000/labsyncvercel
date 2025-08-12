# Phase 1: Ownership Validation Implementation

## Current Ownership Status Analysis

### ✅ Already Implemented
- **Studies**: `createdBy` field exists (Line 351 in schema.ts)
- **Tasks**: `createdBy` field exists (Line 497 in schema.ts)
- **Comments**: `authorId` field exists (ownership pattern)
- **Study Milestones**: `createdById` field exists

### ❌ Missing Ownership Fields
- **Buckets**: No ownership field
- **Ideas**: No ownership field  
- **Deadlines**: No ownership field
- **Team Members**: No ownership field (special case - managed by admin)

---

## Step 1: Database Schema Updates

### 1.1 Add Missing Ownership Fields

```typescript
// Update buckets table in shared/schema.ts
export const buckets = pgTable("buckets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  color: varchar("color").default("#3b82f6"),
  icon: varchar("icon").default("folder"),
  position: varchar("position").default("0"),
  isActive: boolean("is_active").default(true),
  labId: varchar("lab_id").notNull().references(() => labs.id),
  createdById: varchar("created_by_id").references(() => users.id), // NEW FIELD
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Update ideas table in shared/schema.ts  
export const ideas = pgTable("ideas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  category: ideaCategoryEnum("category").default("GENERAL"),
  status: ideaStatusEnum("status").default("BRAINSTORMING"),
  priority: priorityEnum("priority").default("MEDIUM"),
  effortLevel: effortLevelEnum("effort_level"),
  impactLevel: impactLevelEnum("impact_level"),
  potentialFunding: varchar("potential_funding"),
  collaborators: text("collaborators").array(),
  tags: text("tags").array(),
  attachments: json("attachments"),
  isActive: boolean("is_active").default(true),
  labId: varchar("lab_id").notNull().references(() => labs.id),
  createdById: varchar("created_by_id").references(() => users.id), // NEW FIELD
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Update deadlines table in shared/schema.ts
export const deadlines = pgTable("deadlines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  type: deadlineTypeEnum("type").notNull(),
  dueDate: timestamp("due_date").notNull(),
  priority: priorityEnum("priority").default("MEDIUM"),
  assignedTo: text("assigned_to").array(),
  status: varchar("status").default("PENDING"),
  isRecurring: boolean("is_recurring").default(false),
  recurrencePattern: recurrencePatternEnum("recurrence_pattern"),
  reminderSettings: json("reminder_settings"),
  labId: varchar("lab_id").notNull().references(() => labs.id),
  createdById: varchar("created_by_id").references(() => users.id), // NEW FIELD
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

---

## Step 2: Storage Layer Ownership Validation

### 2.1 Add Ownership Validation Methods

```typescript
// Add to server/storage.ts

// Generic ownership validation
async validateOwnership(userId: string, entityType: string, entityId: string): Promise<boolean> {
  try {
    switch (entityType) {
      case 'task':
        const [task] = await db.select({ createdBy: tasks.createdBy })
          .from(tasks).where(eq(tasks.id, entityId));
        return task?.createdBy === userId;
        
      case 'study': 
        const [study] = await db.select({ createdBy: studies.createdBy })
          .from(studies).where(eq(studies.id, entityId));
        return study?.createdBy === userId;
        
      case 'bucket':
        const [bucket] = await db.select({ createdById: buckets.createdById })
          .from(buckets).where(eq(buckets.id, entityId));
        return bucket?.createdById === userId;
        
      case 'idea':
        const [idea] = await db.select({ createdById: ideas.createdById })
          .from(ideas).where(eq(ideas.id, entityId));
        return idea?.createdById === userId;
        
      case 'deadline':
        const [deadline] = await db.select({ createdById: deadlines.createdById })
          .from(deadlines).where(eq(deadlines.id, entityId));
        return deadline?.createdById === userId;
        
      default:
        return false;
    }
  } catch {
    return false;
  }
}

// Admin override validation
async validateAdminOverride(userId: string, labId: string, permission: string): Promise<boolean> {
  try {
    const [member] = await db
      .select({
        isAdmin: labMembers.isAdmin,
        canEditAllProjects: labMembers.canEditAllProjects,
        canManageMembers: labMembers.canManageMembers,
        canApproveIdeas: labMembers.canApproveIdeas,
      })
      .from(labMembers)
      .where(and(
        eq(labMembers.userId, userId),
        eq(labMembers.labId, labId),
        eq(labMembers.isActive, true)
      ));
    
    if (!member) return false;
    
    // Check specific permissions
    switch (permission) {
      case 'canEditAllProjects':
        return member.isAdmin || member.canEditAllProjects;
      case 'canManageMembers':
        return member.isAdmin || member.canManageMembers;
      case 'canApproveIdeas':
        return member.isAdmin || member.canApproveIdeas;
      case 'isAdmin':
        return member.isAdmin;
      default:
        return member.isAdmin;
    }
  } catch {
    return false;
  }
}

// Combined authorization check
async canDeleteEntity(userId: string, entityType: string, entityId: string): Promise<{
  canDelete: boolean;
  reason?: string;
  method?: 'ownership' | 'admin';
}> {
  // First check ownership
  const isOwner = await this.validateOwnership(userId, entityType, entityId);
  if (isOwner) {
    return { canDelete: true, method: 'ownership' };
  }
  
  // Get entity's lab for admin check
  let labId: string | null = null;
  try {
    switch (entityType) {
      case 'task':
        const [task] = await db.select({ 
          labId: studies.labId 
        }).from(tasks)
          .innerJoin(studies, eq(tasks.studyId, studies.id))
          .where(eq(tasks.id, entityId));
        labId = task?.labId;
        break;
        
      case 'study':
        const [study] = await db.select({ labId: studies.labId })
          .from(studies).where(eq(studies.id, entityId));
        labId = study?.labId;
        break;
        
      case 'bucket':
      case 'idea': 
      case 'deadline':
        const table = entityType === 'bucket' ? buckets : 
                     entityType === 'idea' ? ideas : deadlines;
        const [entity] = await db.select({ labId: table.labId })
          .from(table).where(eq(table.id, entityId));
        labId = entity?.labId;
        break;
    }
  } catch (error) {
    return { canDelete: false, reason: 'Entity not found' };
  }
  
  if (!labId) {
    return { canDelete: false, reason: 'Cannot determine lab context' };
  }
  
  // Check admin permissions
  const permission = entityType === 'idea' ? 'canApproveIdeas' : 'canEditAllProjects';
  const hasAdminPermission = await this.validateAdminOverride(userId, labId, permission);
  
  if (hasAdminPermission) {
    return { canDelete: true, method: 'admin' };
  }
  
  return { 
    canDelete: false, 
    reason: `Unauthorized: Not the ${entityType} owner and no admin permissions` 
  };
}
```

---

## Step 3: Route Protection Implementation

### 3.1 Update DELETE Endpoints with Ownership Checks

#### Tasks DELETE Endpoint
```typescript
app.delete("/api/tasks/:id", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.claims.sub;
    const taskId = req.params.id;
    
    // Check authorization
    const authResult = await storage.canDeleteEntity(userId, 'task', taskId);
    if (!authResult.canDelete) {
      return res.status(403).json({ 
        error: "Forbidden", 
        message: authResult.reason 
      });
    }
    
    await storage.deleteTask(taskId);
    res.json({ 
      message: "Task deleted successfully",
      deletedBy: authResult.method 
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Failed to delete task" });
  }
});
```

#### Studies DELETE Endpoint  
```typescript
app.delete("/api/studies/:id", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.claims.sub;
    const studyId = req.params.id;
    const cascade = req.query.cascade === 'true';
    
    // Check authorization
    const authResult = await storage.canDeleteEntity(userId, 'study', studyId);
    if (!authResult.canDelete) {
      return res.status(403).json({ 
        error: "Forbidden", 
        message: authResult.reason 
      });
    }
    
    await storage.deleteStudy(studyId, cascade);
    res.json({ 
      message: "Study deleted successfully",
      deletedBy: authResult.method 
    });
  } catch (error) {
    console.error("Error deleting study:", error);
    const errorMessage = (error as Error).message || "Failed to delete study";
    
    if (errorMessage.includes("Cannot delete study. It contains") && errorMessage.includes("task")) {
      const tasks = await storage.getTasks(studyId);
      res.status(409).json({ 
        message: errorMessage,
        taskCount: tasks.length,
        associatedTasks: tasks.map(task => ({ id: task.id, title: task.title }))
      });
    } else {
      res.status(500).json({ message: errorMessage });
    }
  }
});
```

#### Buckets DELETE Endpoint
```typescript
app.delete("/api/buckets/:id", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.claims.sub;
    const bucketId = req.params.id;
    
    // Check authorization 
    const authResult = await storage.canDeleteEntity(userId, 'bucket', bucketId);
    if (!authResult.canDelete) {
      return res.status(403).json({ 
        error: "Forbidden", 
        message: authResult.reason 
      });
    }
    
    await storage.deleteBucket(bucketId);
    res.json({ 
      message: "Bucket deleted successfully",
      deletedBy: authResult.method 
    });
  } catch (error) {
    console.error("Error deleting bucket:", error);
    res.status(500).json({ message: "Failed to delete bucket" });
  }
});
```

#### Ideas DELETE Endpoint
```typescript
app.delete("/api/ideas/:id", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.claims.sub;
    const ideaId = req.params.id;
    
    // Check authorization
    const authResult = await storage.canDeleteEntity(userId, 'idea', ideaId);
    if (!authResult.canDelete) {
      return res.status(403).json({ 
        error: "Forbidden", 
        message: authResult.reason 
      });
    }
    
    await storage.deleteIdea(ideaId);
    res.json({ 
      message: "Idea deleted successfully",
      deletedBy: authResult.method 
    });
  } catch (error) {
    console.error("Error deleting idea:", error);
    res.status(500).json({ message: "Failed to delete idea" });
  }
});
```

#### Deadlines DELETE Endpoint
```typescript
app.delete("/api/deadlines/:id", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.claims.sub;
    const deadlineId = req.params.id;
    
    // Check authorization
    const authResult = await storage.canDeleteEntity(userId, 'deadline', deadlineId);
    if (!authResult.canDelete) {
      return res.status(403).json({ 
        error: "Forbidden", 
        message: authResult.reason 
      });
    }
    
    await storage.deleteDeadline(deadlineId);
    res.json({ 
      message: "Deadline deleted successfully",
      deletedBy: authResult.method 
    });
  } catch (error) {
    console.error("Error deleting deadline:", error);
    res.status(500).json({ message: "Failed to delete deadline" });
  }
});
```

---

## Step 4: Update Creation Endpoints

### 4.1 Set Ownership on Entity Creation

All CREATE endpoints need to set the ownership field:

```typescript
// Buckets creation
app.post("/api/buckets", isAuthenticated, async (req, res) => {
  try {
    const bucketData = {
      ...req.body,
      createdById: req.user.claims.sub // Set ownership
    };
    const bucket = await storage.createBucket(bucketData);
    res.json(bucket);
  } catch (error) {
    console.error("Error creating bucket:", error);
    res.status(500).json({ message: "Failed to create bucket" });
  }
});

// Ideas creation  
app.post("/api/ideas", isAuthenticated, async (req, res) => {
  try {
    const ideaData = {
      ...req.body,
      createdById: req.user.claims.sub // Set ownership
    };
    const idea = await storage.createIdea(ideaData);
    res.json(idea);
  } catch (error) {
    console.error("Error creating idea:", error);
    res.status(500).json({ message: "Failed to create idea" });
  }
});

// Deadlines creation
app.post("/api/deadlines", isAuthenticated, async (req, res) => {
  try {
    const deadlineData = {
      ...req.body,
      createdById: req.user.claims.sub // Set ownership
    };
    const deadline = await storage.createDeadline(deadlineData);
    res.json(deadline);
  } catch (error) {
    console.error("Error creating deadline:", error);
    res.status(500).json({ message: "Failed to create deadline" });
  }
});
```

---

## Step 5: Database Migration

### 5.1 Update Existing Records

After adding the new ownership fields, update existing records:

```sql
-- Update existing buckets (set creator as lab admin or first user)
UPDATE buckets SET created_by_id = (
  SELECT user_id FROM lab_members 
  WHERE lab_members.lab_id = buckets.lab_id 
  AND lab_members.is_admin = true 
  LIMIT 1
) WHERE created_by_id IS NULL;

-- Update existing ideas  
UPDATE ideas SET created_by_id = (
  SELECT user_id FROM lab_members 
  WHERE lab_members.lab_id = ideas.lab_id 
  AND lab_members.is_admin = true 
  LIMIT 1
) WHERE created_by_id IS NULL;

-- Update existing deadlines
UPDATE deadlines SET created_by_id = (
  SELECT user_id FROM lab_members 
  WHERE lab_members.lab_id = deadlines.lab_id 
  AND lab_members.is_admin = true 
  LIMIT 1
) WHERE created_by_id IS NULL;
```

---

## Implementation Order

1. **Update database schema** (shared/schema.ts)
2. **Add ownership validation methods** (server/storage.ts)  
3. **Update CREATE endpoints** to set ownership
4. **Update DELETE endpoints** with authorization checks
5. **Run database migration** to populate existing records
6. **Test ownership validation** thoroughly

This implementation will immediately enhance security by ensuring only owners or admins can delete entities, closing the critical authorization gap identified in the audit.