import { Router } from "express";
import { db } from "../db";
import { studyMilestones, studies } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { isAuthenticated } from "../replitAuth";

const router = Router();

// Get all study milestones for a lab
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const labId = req.query.labId as string;
    if (!labId) {
      return res.status(400).json({ error: "Lab ID is required" });
    }

    // Get milestones for studies in the specified lab
    const milestonesData = await db
      .select({
        id: studyMilestones.id,
        studyId: studyMilestones.studyId,
        name: studyMilestones.name,
        description: studyMilestones.description,
        targetDate: studyMilestones.targetDate,
        completedDate: studyMilestones.completedDate,
        status: studyMilestones.status,
        priority: studyMilestones.priority,
        progress: studyMilestones.progress,
        assignedTo: studyMilestones.assignedTo,
        dependencies: studyMilestones.dependencies,
        deliverables: studyMilestones.deliverables,
        notes: studyMilestones.notes,
        createdAt: studyMilestones.createdAt,
        updatedAt: studyMilestones.updatedAt,
        studyName: studies.name,
      })
      .from(studyMilestones)
      .innerJoin(studies, eq(studyMilestones.studyId, studies.id))
      .where(eq(studies.labId, labId))
      .orderBy(studyMilestones.targetDate);

    res.json(milestonesData);
  } catch (error) {
    console.error("Error fetching study milestones:", error);
    res.status(500).json({ error: "Failed to fetch study milestones" });
  }
});

// Create a new study milestone
router.post("/", isAuthenticated, async (req, res) => {
  try {
    const userId = (req.user as any)?.claims?.sub;
    const milestoneData = {
      ...req.body,
      createdBy: userId,
    };

    const [milestone] = await db
      .insert(studyMilestones)
      .values(milestoneData)
      .returning();

    res.status(201).json(milestone);
  } catch (error) {
    console.error("Error creating study milestone:", error);
    res.status(500).json({ error: "Failed to create study milestone" });
  }
});

// Update a study milestone
router.put("/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: new Date(),
    };

    const [milestone] = await db
      .update(studyMilestones)
      .set(updateData)
      .where(eq(studyMilestones.id, id))
      .returning();

    if (!milestone) {
      return res.status(404).json({ error: "Study milestone not found" });
    }

    res.json(milestone);
  } catch (error) {
    console.error("Error updating study milestone:", error);
    res.status(500).json({ error: "Failed to update study milestone" });
  }
});

// Delete a study milestone
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    const [milestone] = await db
      .delete(studyMilestones)
      .where(eq(studyMilestones.id, id))
      .returning();

    if (!milestone) {
      return res.status(404).json({ error: "Study milestone not found" });
    }

    res.json({ message: "Study milestone deleted successfully" });
  } catch (error) {
    console.error("Error deleting study milestone:", error);
    res.status(500).json({ error: "Failed to delete study milestone" });
  }
});

export default router;