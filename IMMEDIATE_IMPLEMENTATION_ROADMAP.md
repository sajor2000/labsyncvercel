# Immediate Security Implementation Roadmap

## Current Status Assessment

### ✅ Security Strengths Already in Place
1. **Authentication**: All DELETE endpoints protected with `isAuthenticated` middleware
2. **Soft Deletes**: Comprehensive `isActive` pattern implemented 
3. **UI Confirmation**: Professional confirmation dialogs with clear warnings
4. **Cascade Protection**: Study deletion prevents accidental data loss
5. **Existing Ownership**: Studies and tasks already have `createdBy` fields

### ❌ Critical Gaps to Address
1. **Missing Ownership Validation**: DELETE endpoints don't check ownership
2. **Missing Ownership Fields**: Buckets, ideas, deadlines lack ownership tracking
3. **No Audit Logging**: Security events not logged for accountability
4. **No Admin Override**: Role permissions exist but not enforced

---

## Phase 1: Immediate Ownership Implementation (Week 1)

### Day 1: Fix Database Column Issue & Add Missing Ownership Fields

#### Fix Existing Team Members Query Issue
The current error shows a mismatch between schema fields and queries. The users table uses camelCase (`firstName`) but queries expect snake_case (`first_name`).

#### Add Missing Ownership Fields to Schema
```typescript
// Update shared/schema.ts - Add these fields

// Buckets table - add ownership
export const buckets = pgTable("buckets", {
  // ... existing fields ...
  createdById: varchar("created_by_id").references(() => users.id),
  // ... rest of fields ...
});

// Ideas table - add ownership (check if it exists first)
export const ideas = pgTable("ideas", {
  // ... existing fields ...
  createdById: varchar("created_by_id").references(() => users.id),
  // ... rest of fields ...
});

// Deadlines table - add ownership (check if it exists first)  
export const deadlines = pgTable("deadlines", {
  // ... existing fields ...
  createdById: varchar("created_by_id").references(() => users.id),
  // ... rest of fields ...
});
```

### Day 2: Implement Core Ownership Validation

#### Add to server/storage.ts
```typescript
// Core ownership validation methods
async validateOwnership(userId: string, entityType: string, entityId: string): Promise<boolean>
async validateAdminOverride(userId: string, labId: string, permission: string): Promise<boolean>  
async canDeleteEntity(userId: string, entityType: string, entityId: string): Promise<AuthResult>

interface AuthResult {
  canDelete: boolean;
  reason?: string;
  method?: 'ownership' | 'admin';
}
```

### Day 3-4: Update All DELETE Endpoints

#### Priority Order:
1. **Tasks DELETE** - Most critical (high volume)
2. **Studies DELETE** - High impact 
3. **Buckets DELETE** - Structural impact
4. **Ideas DELETE** - User content
5. **Deadlines DELETE** - Workflow critical

#### Standard Implementation Pattern:
```typescript
app.delete("/api/{entity}/:id", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.claims.sub;
    const entityId = req.params.id;
    
    // Check authorization
    const authResult = await storage.canDeleteEntity(userId, '{entity}', entityId);
    if (!authResult.canDelete) {
      return res.status(403).json({ 
        error: "Forbidden", 
        message: authResult.reason 
      });
    }
    
    await storage.delete{Entity}(entityId);
    res.json({ 
      message: "{Entity} deleted successfully",
      deletedBy: authResult.method 
    });
  } catch (error) {
    console.error(`Error deleting {entity}:`, error);
    res.status(500).json({ message: "Failed to delete {entity}" });
  }
});
```

### Day 5-7: Update CREATE Endpoints & Testing

#### Set Ownership on Creation:
```typescript
// All CREATE endpoints need ownership
const entityData = {
  ...req.body,
  createdById: req.user.claims.sub // For buckets, ideas, deadlines
  // createdBy: req.user.claims.sub // For tasks, studies (existing pattern)
};
```

#### Testing Protocol:
1. **Owner can delete**: ✅ Expected
2. **Non-owner cannot delete**: ❌ 403 Forbidden  
3. **Admin can delete**: ✅ Expected (override)
4. **Cross-lab attempt**: ❌ 403 Forbidden

---

## Phase 2: Audit Logging System (Week 2)

### Day 1-2: Audit Log Database Schema

#### Create Audit Logs Table
```typescript
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: varchar("action").notNull(), // DELETE, CREATE, UPDATE, LOGIN
  entityType: varchar("entity_type").notNull(), // Task, Study, Bucket, etc.
  entityId: varchar("entity_id"),
  entityName: varchar("entity_name"), // For context
  
  // Request context
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  endpoint: varchar("endpoint"),
  
  // Change details
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  metadata: jsonb("metadata"),
  
  // Context
  sessionId: varchar("session_id"),
  labId: varchar("lab_id").references(() => labs.id),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIndex: index("audit_user_idx").on(table.userId, table.createdAt),
  actionIndex: index("audit_action_idx").on(table.action, table.createdAt),
  entityIndex: index("audit_entity_idx").on(table.entityType, table.entityId),
}));
```

### Day 3-4: Audit Logger Service

#### Create server/auditLogger.ts
```typescript
export class AuditLogger {
  async logDeletion(params: {
    userId: string;
    entityType: string;
    entityId: string;
    entityName: string;
    req: Request;
    deletedBy: 'ownership' | 'admin';
  }): Promise<void>
  
  async logAction(params: AuditLogParams): Promise<void>
}
```

### Day 5-7: Integration & Testing

#### Add to All DELETE Endpoints:
```typescript
// After successful deletion
await auditLogger.logDeletion({
  userId,
  entityType: 'task',
  entityId,
  entityName: task.title,
  req,
  deletedBy: authResult.method
});
```

---

## Phase 3: Enhanced Security Features (Week 3)

### Day 1-3: Permission Middleware

#### Create Comprehensive Permission System
```typescript
// Permission validation middleware
const requirePermission = (permission: string) => async (req, res, next) => {
  const userId = req.user.claims.sub;
  const labId = req.body.labId || req.query.labId;
  
  const hasPermission = await storage.validateAdminOverride(userId, labId, permission);
  if (!hasPermission) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }
  next();
};

// Usage
app.delete("/api/buckets/:id", 
  isAuthenticated, 
  requirePermission('isAdmin'), 
  async (req, res) => { /* ... */ }
);
```

### Day 4-5: Cross-Lab Security

#### Enhanced Lab Isolation
- Validate all operations within lab context
- Prevent data leakage between labs
- Implement lab-scoped audit logs

### Day 6-7: Performance Optimization

#### Database Indexing
- Optimize ownership validation queries
- Index audit log tables efficiently
- Monitor performance impact

---

## Phase 4: Admin Interface & Monitoring (Week 4)

### Day 1-3: Audit Log Viewer

#### Admin Dashboard Features
- Security event timeline
- Failed access attempts
- User activity summary
- Export capabilities

### Day 4-5: Restore Functionality

#### Soft Delete Recovery
- Admin interface for viewing deleted items
- Restore confirmation workflow
- Restore audit logging

### Day 6-7: Final Security Hardening

#### Additional Security Features
- Rate limiting implementation
- Session management improvements
- Security headers enforcement

---

## Success Metrics & Validation

### Week 1 Targets
- ✅ All DELETE endpoints check ownership
- ✅ 403 Forbidden for unauthorized attempts
- ✅ Admin override working correctly
- ✅ Zero unauthorized deletions possible

### Week 2 Targets  
- ✅ 100% audit trail coverage
- ✅ Comprehensive deletion logging
- ✅ Performance impact <50ms
- ✅ Audit log retention working

### Week 3 Targets
- ✅ Permission middleware active
- ✅ Cross-lab isolation verified
- ✅ Role-based access functional
- ✅ Performance optimized

### Week 4 Targets
- ✅ Admin audit interface ready
- ✅ Restore functionality working
- ✅ Security monitoring active
- ✅ Full enterprise security grade

---

## Risk Mitigation

### Implementation Risks
1. **Database Migration**: Use careful schema updates with backup
2. **Performance Impact**: Monitor query performance continuously  
3. **User Experience**: Maintain existing UI/UX patterns
4. **Data Integrity**: Use transactions for atomic operations

### Rollback Plan
1. **Week 1**: Can revert ownership validation (soft fail)
2. **Week 2**: Audit logging is additive (safe to disable)
3. **Week 3**: Permission middleware can be bypassed
4. **Week 4**: UI features can be feature-flagged

---

This roadmap transforms the lab management system from **B+ security** to **enterprise-grade A+ security** while maintaining all existing functionality and user experience.