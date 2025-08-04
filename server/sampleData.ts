import { db } from "./db";
import { buckets, studies, labs } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function createSampleData() {
  try {
    // Get existing labs
    const existingLabs = await db.select().from(labs);
    if (existingLabs.length === 0) {
      console.log("No labs found. Please create labs first.");
      return;
    }

    const [lab1, lab2] = existingLabs;

    // Create sample buckets
    const sampleBuckets = [
      {
        name: "Abbott",
        color: "#3b82f6",
        labId: lab1.id,
      },
      {
        name: "Wisconsin R01",
        color: "#ef4444",
        labId: lab1.id,
      },
      {
        name: "RHEDAS Research",
        color: "#f59e0b",
        labId: lab2?.id || lab1.id,
      },
      {
        name: "Community Analytics",
        color: "#8b5cf6",
        labId: lab2?.id || lab1.id,
      },
    ];

    // Insert buckets
    const insertedBuckets = [];
    for (const bucketData of sampleBuckets) {
      const [bucket] = await db.insert(buckets).values(bucketData).returning();
      insertedBuckets.push(bucket);
    }

    // Create sample studies matching the Airtable structure
    const sampleStudies = [
      {
        name: "Abbott prostate cancer study",
        status: "ANALYSIS" as const,
        studyType: "retrospective EHR data analysis",
        assignees: ["JC", "Mia", "Nag", "Cherise", "Abbott team"],
        funding: "INDUSTRY_SPONSORED" as const,
        externalCollaborators: "Abbott Laboratories",
        bucketId: insertedBuckets[0].id, // Abbott bucket
        labId: lab1.id,
        createdBy: "sample-user",
      },
      {
        name: "Abbott GSD/TSH studies",
        status: "ANALYSIS" as const,
        studyType: "retrospective EHR data analysis",
        assignees: ["JC", "Mia"],
        funding: "INDUSTRY_SPONSORED" as const,
        externalCollaborators: "Abbott Laboratories",
        bucketId: insertedBuckets[0].id, // Abbott bucket
        labId: lab1.id,
        createdBy: "sample-user",
      },
      {
        name: "SMART AI Trial",
        status: "ANALYSIS" as const,
        studyType: "quasi-RCT (pre-post design) non-inferiority trial",
        assignees: ["JC", "Vaishvik", "Mia"],
        funding: "NIH" as const,
        externalCollaborators: "University of Wisconsin-Madison",
        bucketId: insertedBuckets[1].id, // Wisconsin R01 bucket
        labId: lab1.id,
        createdBy: "sample-user",
      },
      {
        name: "SMART AI Qualitative Study",
        status: "MANUSCRIPT" as const,
        studyType: "qualitative interview study",
        assignees: ["JC", "Vaishvik"],
        funding: "NIH" as const,
        externalCollaborators: "University of Wisconsin-Madison",
        bucketId: insertedBuckets[1].id, // Wisconsin R01 bucket
        labId: lab1.id,
        createdBy: "sample-user",
      },
      {
        name: "Health Disparities in Rural Communities",
        status: "DATA_COLLECTION" as const,
        studyType: "cross-sectional survey study",
        assignees: ["Dr. Chen", "Sarah", "Miguel"],
        funding: "FOUNDATION" as const,
        externalCollaborators: "Rural Health Coalition",
        bucketId: insertedBuckets[2].id, // RHEDAS Research bucket
        labId: lab2?.id || lab1.id,
        createdBy: "sample-user",
      },
      {
        name: "Social Determinants Impact Analysis",
        status: "IRB_APPROVED" as const,
        studyType: "longitudinal cohort study",
        assignees: ["Dr. Chen", "Alex", "Jordan"],
        funding: "INTERNAL" as const,
        externalCollaborators: "Chicago Department of Public Health",
        bucketId: insertedBuckets[3].id, // Community Analytics bucket
        labId: lab2?.id || lab1.id,
        createdBy: "sample-user",
      },
    ];

    // Insert studies
    for (const studyData of sampleStudies) {
      await db.insert(studies).values(studyData);
    }

    console.log("Sample data created successfully!");
    return {
      bucketsCreated: insertedBuckets.length,
      studiesCreated: sampleStudies.length,
    };
  } catch (error) {
    console.error("Error creating sample data:", error);
    throw error;
  }
}