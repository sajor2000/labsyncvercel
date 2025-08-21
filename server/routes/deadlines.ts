import { Router } from 'express';
import { db } from '../db';
import { deadlines, labs, teamMembers, studies } from '../../shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { isAuthenticated } from '../auth/localAuth';
import { handleError, handleNotFound, handleUnauthorized } from '../utils/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/deadlines - Get all deadlines for a lab
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { labId } = req.query;
    const userId = req.user!.id;

    if (!labId) {
      return res.status(400).json({ error: 'Lab ID is required' });
    }

    // Check if user has access to this lab
    const userLabs = await db
      .select({ labId: labs.id })
      .from(labs)
      .leftJoin(teamMembers, eq(teamMembers.labId, labs.id))
      .where(
        and(
          eq(labs.id, labId as string),
          eq(teamMembers.userId, userId)
        )
      );

    if (userLabs.length === 0) {
      return handleUnauthorized(res, "You don't have access to this lab");
    }

    const labDeadlines = await db
      .select({
        id: deadlines.id,
        title: deadlines.title,
        description: deadlines.description,
        dueDate: deadlines.dueDate,
        status: deadlines.status,
        priority: deadlines.priority,
        type: deadlines.type,
        assignedTo: deadlines.assignedTo,
        relatedStudyId: deadlines.relatedStudyId,
        labId: deadlines.labId,
        createdBy: deadlines.createdBy,
        createdAt: deadlines.createdAt,
        updatedAt: deadlines.updatedAt,
        assignedToName: sql<string>`CONCAT(${teamMembers.firstName}, ' ', ${teamMembers.lastName})`,
        createdByName: sql<string>`CONCAT(tm_creator.first_name, ' ', tm_creator.last_name)`,
        relatedStudyTitle: studies.title,
      })
      .from(deadlines)
      .leftJoin(teamMembers, eq(teamMembers.userId, deadlines.assignedTo))
      .leftJoin(teamMembers.as('tm_creator'), eq(sql`tm_creator.user_id`, deadlines.createdBy))
      .leftJoin(studies, eq(studies.id, deadlines.relatedStudyId))
      .where(eq(deadlines.labId, labId as string))
      .orderBy(desc(deadlines.dueDate));

    logger.performance('Deadlines fetched', {
      labId,
      count: labDeadlines.length,
      userId
    });

    res.json(labDeadlines);
  } catch (error) {
    handleError(res, error, "Failed to fetch deadlines");
  }
});

// POST /api/deadlines - Create a new deadline
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const {
      title,
      description,
      dueDate,
      status = 'PENDING',
      priority = 'MEDIUM',
      type,
      assignedTo,
      relatedStudyId,
      labId
    } = req.body;
    const userId = req.user!.id;

    if (!title || !dueDate || !type || !labId) {
      return res.status(400).json({ 
        error: 'Title, due date, type, and lab ID are required' 
      });
    }

    // Check if user has access to create deadlines in this lab
    const userLab = await db
      .select({ 
        labId: labs.id,
        canManageDeadlines: teamMembers.canManageDeadlines,
        role: teamMembers.role 
      })
      .from(labs)
      .leftJoin(teamMembers, eq(teamMembers.labId, labs.id))
      .where(
        and(
          eq(labs.id, labId),
          eq(teamMembers.userId, userId)
        )
      );

    if (userLab.length === 0) {
      return handleUnauthorized(res, "You don't have access to this lab");
    }

    const canCreate = userLab[0].canManageDeadlines || 
                     ['PI', 'Co-PI', 'Lab Manager', 'Coordinator'].includes(userLab[0].role);

    if (!canCreate) {
      return handleUnauthorized(res, "You don't have permission to create deadlines");
    }

    // Validate assignedTo exists if provided
    if (assignedTo) {
      const assignee = await db
        .select()
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.userId, assignedTo),
            eq(teamMembers.labId, labId)
          )
        );

      if (assignee.length === 0) {
        return res.status(400).json({ 
          error: 'Assigned user not found in this lab' 
        });
      }
    }

    // Validate related study exists if provided
    if (relatedStudyId) {
      const study = await db
        .select()
        .from(studies)
        .where(eq(studies.id, relatedStudyId));

      if (study.length === 0) {
        return res.status(400).json({ 
          error: 'Related study not found' 
        });
      }
    }

    const [newDeadline] = await db
      .insert(deadlines)
      .values({
        title,
        description,
        dueDate: new Date(dueDate),
        status,
        priority,
        type,
        assignedTo,
        relatedStudyId,
        labId,
        createdBy: userId
      })
      .returning();

    logger.audit('Deadline created', {
      deadlineId: newDeadline.id,
      title,
      labId,
      userId,
      assignedTo
    });

    res.status(201).json(newDeadline);
  } catch (error) {
    handleError(res, error, "Failed to create deadline");
  }
});

// PUT /api/deadlines/:id - Update a deadline
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user!.id;

    // Get existing deadline
    const existingDeadline = await db
      .select()
      .from(deadlines)
      .where(eq(deadlines.id, id));

    if (existingDeadline.length === 0) {
      return handleNotFound(res, "Deadline not found");
    }

    const deadline = existingDeadline[0];

    // Check if user has permission to update this deadline
    const userLab = await db
      .select({ 
        canManageDeadlines: teamMembers.canManageDeadlines,
        role: teamMembers.role 
      })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.labId, deadline.labId),
          eq(teamMembers.userId, userId)
        )
      );

    if (userLab.length === 0) {
      return handleUnauthorized(res, "You don't have access to this lab");
    }

    const canUpdate = userLab[0].canManageDeadlines ||
                     ['PI', 'Co-PI', 'Lab Manager', 'Coordinator'].includes(userLab[0].role) ||
                     deadline.createdBy === userId ||
                     deadline.assignedTo === userId;

    if (!canUpdate) {
      return handleUnauthorized(res, "You don't have permission to update this deadline");
    }

    // Validate assignedTo if being updated
    if (updateData.assignedTo && updateData.assignedTo !== deadline.assignedTo) {
      const assignee = await db
        .select()
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.userId, updateData.assignedTo),
            eq(teamMembers.labId, deadline.labId)
          )
        );

      if (assignee.length === 0) {
        return res.status(400).json({ 
          error: 'Assigned user not found in this lab' 
        });
      }
    }

    // Update deadline
    const [updatedDeadline] = await db
      .update(deadlines)
      .set({
        ...updateData,
        dueDate: updateData.dueDate ? new Date(updateData.dueDate) : deadline.dueDate,
        updatedAt: new Date()
      })
      .where(eq(deadlines.id, id))
      .returning();

    logger.audit('Deadline updated', {
      deadlineId: id,
      labId: deadline.labId,
      userId,
      changes: Object.keys(updateData)
    });

    res.json(updatedDeadline);
  } catch (error) {
    handleError(res, error, "Failed to update deadline");
  }
});

// DELETE /api/deadlines/:id - Delete a deadline
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Get existing deadline
    const existingDeadline = await db
      .select()
      .from(deadlines)
      .where(eq(deadlines.id, id));

    if (existingDeadline.length === 0) {
      return handleNotFound(res, "Deadline not found");
    }

    const deadline = existingDeadline[0];

    // Check if user has permission to delete this deadline
    const userLab = await db
      .select({ 
        canManageDeadlines: teamMembers.canManageDeadlines,
        role: teamMembers.role 
      })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.labId, deadline.labId),
          eq(teamMembers.userId, userId)
        )
      );

    if (userLab.length === 0) {
      return handleUnauthorized(res, "You don't have access to this lab");
    }

    const canDelete = userLab[0].canManageDeadlines ||
                     ['PI', 'Co-PI', 'Lab Manager'].includes(userLab[0].role) ||
                     deadline.createdBy === userId;

    if (!canDelete) {
      return handleUnauthorized(res, "You don't have permission to delete this deadline");
    }

    // Delete the deadline
    await db
      .delete(deadlines)
      .where(eq(deadlines.id, id));

    logger.audit('Deadline deleted', {
      deadlineId: id,
      title: deadline.title,
      labId: deadline.labId,
      userId
    });

    res.status(204).send();
  } catch (error) {
    handleError(res, error, "Failed to delete deadline");
  }
});

// POST /api/deadlines/bulk-upload - Bulk upload deadlines
router.post('/bulk-upload', isAuthenticated, async (req, res) => {
  try {
    const { deadlines: deadlinesList } = req.body;
    const userId = req.user!.id;

    if (!deadlinesList || !Array.isArray(deadlinesList)) {
      return res.status(400).json({ 
        error: 'Deadlines array is required' 
      });
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as any[]
    };

    for (let i = 0; i < deadlinesList.length; i++) {
      try {
        const deadlineData = deadlinesList[i];
        
        // Validate required fields
        if (!deadlineData.title || !deadlineData.dueDate || !deadlineData.type || !deadlineData.labId) {
          results.failed++;
          results.errors.push({
            index: i,
            error: 'Missing required fields: title, dueDate, type, labId'
          });
          continue;
        }

        // Check user permission for this lab
        const userLab = await db
          .select({ 
            canManageDeadlines: teamMembers.canManageDeadlines,
            role: teamMembers.role 
          })
          .from(teamMembers)
          .where(
            and(
              eq(teamMembers.labId, deadlineData.labId),
              eq(teamMembers.userId, userId)
            )
          );

        if (userLab.length === 0) {
          results.failed++;
          results.errors.push({
            index: i,
            error: 'No access to lab'
          });
          continue;
        }

        const canCreate = userLab[0].canManageDeadlines || 
                         ['PI', 'Co-PI', 'Lab Manager', 'Coordinator'].includes(userLab[0].role);

        if (!canCreate) {
          results.failed++;
          results.errors.push({
            index: i,
            error: 'No permission to create deadlines'
          });
          continue;
        }

        // Create deadline
        await db
          .insert(deadlines)
          .values({
            ...deadlineData,
            dueDate: new Date(deadlineData.dueDate),
            createdBy: userId,
            status: deadlineData.status || 'PENDING',
            priority: deadlineData.priority || 'MEDIUM'
          });

        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.audit('Bulk deadline upload completed', {
      userId,
      total: deadlinesList.length,
      successful: results.successful,
      failed: results.failed
    });

    res.json(results);
  } catch (error) {
    handleError(res, error, "Failed to bulk upload deadlines");
  }
});

export { router as deadlineRoutes };