// Simple Team Seeding Script for Enhanced Lab Management
import { db } from "../server/db";
import { labs, users, labMembers } from "../shared/schema";
import { eq } from "drizzle-orm";

// Simplified Team Roster
const TEAM_ROSTER = [
  {
    firstName: 'J.C.',
    lastName: 'Rojas',
    email: 'Juan_rojas@rush.edu',
    initials: 'JCR',
    role: 'PRINCIPAL_INVESTIGATOR' as const,
    labs: ['RICCC', 'RHEDAS'],
    capacity: 40,
    title: 'Principal Investigator',
    department: 'Internal Medicine - Critical Care',
  },
  {
    firstName: 'Kevin',
    lastName: 'Buell',
    email: 'Kevin_Buell@rush.edu', 
    initials: 'KB',
    role: 'PRINCIPAL_INVESTIGATOR' as const,
    labs: ['RICCC'],
    capacity: 40,
    title: 'Principal Investigator',
    department: 'Internal Medicine - Critical Care',
  },
  {
    firstName: 'Mia',
    lastName: 'Mcclintic',
    middleName: 'R',
    email: 'Mia_R_McClintic@rush.edu',
    initials: 'MRM',
    role: 'REGULATORY_COORDINATOR' as const,
    labs: ['RICCC'],
    capacity: 40,
    title: 'Regulatory Coordinator',
    department: 'Research Administration',
  },
  {
    firstName: 'Vaishvik',
    lastName: 'Chaudhari',
    email: 'Vaishvik_Chaudhari@rush.edu',
    initials: 'VC',
    role: 'DATA_SCIENTIST' as const,
    labs: ['RICCC'],
    capacity: 40,
    title: 'Senior Data Scientist',
    department: 'Data Science',
  },
  {
    firstName: 'Jason',
    lastName: 'Stanghelle',
    email: 'Jason_Stanghelle@rush.edu',
    initials: 'JS',
    role: 'DATA_ANALYST' as const,
    labs: ['RHEDAS'],
    capacity: 40,
    title: 'Senior Data Analyst',
    department: 'Data Science',
  },
  {
    firstName: 'Meher Sapna',
    lastName: 'Masanpally',
    email: 'MeherSapna_Masanpally@rush.edu',
    initials: 'MSM',
    role: 'DATA_ANALYST' as const,
    labs: ['RHEDAS'],
    capacity: 40,
    title: 'Data Analyst',
    department: 'Data Science',
  },
  {
    firstName: 'Jada',
    middleName: 'J',
    lastName: 'Sherrod',
    email: 'Jada_J_Sherrod@rush.edu',
    initials: 'JJS',
    role: 'STAFF_COORDINATOR' as const,
    labs: ['RHEDAS'],
    capacity: 40,
    title: 'Staff Coordinator',
    department: 'Research Operations',
  },
  {
    firstName: 'Hoda',
    lastName: 'Masteri',
    email: 'Hoda_MasteriFarahani@rush.edu',
    initials: 'HM',
    role: 'DATA_ANALYST' as const,
    labs: ['RICCC'],
    capacity: 40,
    title: 'Clinical Data Analyst',
    department: 'Clinical Informatics',
  },
];

function generateAvatarColor(initials: string): string {
  const colors = ['#8B5CF6', '#22C55E', '#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#6366F1', '#EC4899'];
  const hash = initials.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function getRolePermissions(role: string) {
  const permissions = {
    'PRINCIPAL_INVESTIGATOR': {
      isAdmin: true,
      canCreateProjects: true,
      canAssignTasks: true,
      canViewAllProjects: true,
      canEditAllProjects: true,
      canManageMembers: true,
      canApproveIdeas: true,
      canAccessReports: true
    },
    'DATA_SCIENTIST': {
      canCreateProjects: true,
      canAssignTasks: true,
      canViewAllProjects: true,
      canEditAllProjects: false,
      canAccessReports: true
    },
    'DATA_ANALYST': {
      canCreateProjects: false,
      canAssignTasks: true,
      canViewAllProjects: true,
      canEditAllProjects: false,
      canAccessReports: true
    },
    'REGULATORY_COORDINATOR': {
      canCreateProjects: false,
      canAssignTasks: true,
      canViewAllProjects: true,
      canEditAllProjects: true,
      canAccessReports: true,
      canApproveIdeas: true
    },
    'STAFF_COORDINATOR': {
      canCreateProjects: false,
      canAssignTasks: true,
      canViewAllProjects: true,
      canEditAllProjects: false,
      canManageMembers: true,
      canAccessReports: true
    }
  };
  
  return permissions[role] || {
    canCreateProjects: false,
    canAssignTasks: false,
    canViewAllProjects: false,
    canEditAllProjects: false,
    canManageMembers: false,
    canApproveIdeas: false,
    canAccessReports: false,
    isAdmin: false
  };
}

export async function seedSimpleTeam() {
  console.log('🌱 Starting simple team seeding...');

  try {
    // Update existing labs with enhanced information
    const [ricccLab] = await db.update(labs)
      .set({
        shortName: 'RICCC',
        fullName: 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science (RICCC)',
        department: 'Internal Medicine - Critical Care',
        description: 'Advancing critical care through innovative research and collaboration',
        primaryColor: '#8B5CF6',
      })
      .where(eq(labs.name, 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science (RICCC)'))
      .returning();

    const [rhedasLab] = await db.update(labs)
      .set({
        shortName: 'RHEDAS', 
        fullName: 'Rush Health Equity Data Analytics Studio (RHEDAS)',
        department: 'Internal Medicine',
        description: 'Health equity research through data science and analytics',
        primaryColor: '#22C55E',
      })
      .where(eq(labs.name, 'Rush Health Equity Data Analytics Studio (RHEDAS)'))
      .returning();

    // If labs don't exist, get their IDs from the database
    const allLabs = await db.select().from(labs);
    const labMap = {
      RICCC: allLabs.find(l => l.name.includes('RICCC') || l.name.includes('Critical Care'))?.id || allLabs[0]?.id,
      RHEDAS: allLabs.find(l => l.name.includes('RHEDAS') || l.name.includes('Health Equity'))?.id || allLabs[1]?.id,
    };

    console.log('✅ Labs updated');

    // Create/update users and lab memberships
    for (const member of TEAM_ROSTER) {
      const { labs: memberLabs, middleName, ...userData } = member;
      
      const fullName = `${member.firstName}${middleName ? ' ' + middleName : ''} ${member.lastName}`;
      
      // Update user with enhanced information
      const [user] = await db.insert(users).values({
        ...userData,
        name: fullName,
        middleName: middleName || null,
        avatar: generateAvatarColor(member.initials),
        institution: 'Rush University Medical Center',
      }).onConflictDoUpdate({
        target: users.email,
        set: {
          name: fullName,
          middleName: middleName || null,
          title: userData.title,
          department: userData.department,
          initials: userData.initials,
          role: userData.role,
          capacity: userData.capacity.toString(),
        }
      }).returning();

      // Create lab memberships with role-based permissions
      for (const labName of memberLabs) {
        const permissions = getRolePermissions(member.role);
        
        if (labMap[labName]) {
          await db.insert(labMembers).values({
            userId: user.id,
            labId: labMap[labName],
            ...permissions,
          }).onConflictDoUpdate({
            target: [labMembers.userId, labMembers.labId],
            set: permissions,
          });
        }
      }

      console.log(`✅ Created user: ${fullName} (${memberLabs.join(', ')})`);
    }

    console.log('🎉 Simple team seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding simple team:', error);
    throw error;
  }
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSimpleTeam()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}