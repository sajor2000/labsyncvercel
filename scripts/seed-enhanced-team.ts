// Enhanced Team Seeding Script for World-Class CRUD Lab Management
import { db } from "../server/db";
import { labs, users, labMembers, rolePermissions } from "../shared/schema";
import { eq, and } from "drizzle-orm";

// Comprehensive Team Roster with Enhanced Professional Information
const ENHANCED_TEAM_ROSTER = [
  {
    firstName: 'J.C.',
    lastName: 'Rojas',
    email: 'Juan_rojas@rush.edu',
    initials: 'JCR',
    role: 'PRINCIPAL_INVESTIGATOR' as const,
    labs: ['RICCC', 'RHEDAS'],
    capacity: 40,
    expertise: ['Critical Care', 'Clinical Research', 'Grant Writing'],
    skills: ['Leadership', 'Grant Management', 'Clinical Trials'],
    department: 'Internal Medicine - Critical Care',
    title: 'Principal Investigator',
  },
  {
    firstName: 'Kevin',
    lastName: 'Buell',
    email: 'Kevin_Buell@rush.edu', 
    initials: 'KB',
    role: 'PRINCIPAL_INVESTIGATOR' as const,
    labs: ['RICCC'],
    capacity: 40,
    expertise: ['Critical Care', 'Medical Education'],
    skills: ['Clinical Leadership', 'Medical Education', 'Research'],
    department: 'Internal Medicine - Critical Care',
    title: 'Principal Investigator',
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
    expertise: ['IRB Submissions', 'Regulatory Compliance', 'Documentation'],
    skills: ['IRB Management', 'Regulatory Affairs', 'Documentation', 'Compliance'],
    department: 'Research Administration',
    title: 'Regulatory Coordinator',
  },
  {
    firstName: 'Jason',
    lastName: 'Stanghelle',
    email: 'Jason_Stanghelle@rush.edu',
    initials: 'JS',
    role: 'DATA_ANALYST' as const,
    labs: ['RHEDAS'],
    capacity: 40,
    expertise: ['Statistical Analysis', 'R', 'Data Visualization'],
    skills: ['R', 'Python', 'SAS', 'REDCap', 'Statistical Analysis'],
    department: 'Data Science',
    title: 'Senior Data Analyst',
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
    expertise: ['Project Management', 'Team Coordination'],
    skills: ['Project Management', 'Team Leadership', 'Communication'],
    department: 'Research Operations',
    title: 'Staff Coordinator',
  },
  {
    firstName: 'Meher Sapna',
    lastName: 'Masanpally',
    email: 'MeherSapna_Masanpally@rush.edu',
    initials: 'MSM',
    role: 'DATA_ANALYST' as const,
    labs: ['RHEDAS'],
    capacity: 40,
    expertise: ['Data Analysis', 'Python', 'Machine Learning'],
    skills: ['Python', 'SQL', 'Tableau', 'Power BI', 'Machine Learning'],
    department: 'Data Science',
    title: 'Data Analyst',
  },
  {
    firstName: 'Kian',
    lastName: 'Mokhlesi',
    email: 'kianmokhlesi@gmail.com',
    initials: 'KM',
    role: 'MEDICAL_STUDENT' as const,
    labs: ['RICCC'],
    capacity: 20, // Part-time
    isExternal: true, // Using personal email
    expertise: ['Clinical Research', 'Data Collection'],
    skills: ['Clinical Research', 'Data Entry', 'Literature Review'],
    department: 'Rush Medical College',
    title: 'Medical Student',
  },
  {
    firstName: 'Dariush',
    lastName: 'Mokhlesi',
    email: 'dariushmokhlesi@gmail.com',
    initials: 'DM',
    role: 'MEDICAL_STUDENT' as const,
    labs: ['RICCC'],
    capacity: 20, // Part-time
    isExternal: true,
    expertise: ['Clinical Research', 'Literature Review'],
    skills: ['Research Methods', 'Literature Review', 'Data Collection'],
    department: 'Rush Medical College',
    title: 'Medical Student',
  },
  {
    firstName: 'Connor',
    middleName: 'P',
    lastName: 'Lafeber',
    email: 'Connor_P_Lafeber@rush.edu',
    initials: 'CPL',
    role: 'FELLOW' as const,
    labs: ['RICCC'],
    capacity: 50, // Fellows often work more
    expertise: ['Critical Care', 'Clinical Trials', 'Medical Writing'],
    skills: ['Clinical Research', 'Medical Writing', 'Statistical Analysis'],
    department: 'Internal Medicine - Critical Care',
    title: 'Critical Care Fellow',
  },
  {
    firstName: 'Vaishvik',
    lastName: 'Chaudhari',
    email: 'Vaishvik_Chaudhari@rush.edu',
    initials: 'VC',
    role: 'DATA_SCIENTIST' as const,
    labs: ['RICCC'],
    capacity: 40,
    expertise: ['Machine Learning', 'AI/LLM', 'Predictive Modeling'],
    skills: ['Python', 'TensorFlow', 'PyTorch', 'SQL', 'AWS', 'Machine Learning'],
    department: 'Data Science',
    title: 'Senior Data Scientist',
  },
  {
    firstName: 'Hoda',
    lastName: 'Masteri',
    email: 'Hoda_MasteriFarahani@rush.edu',
    initials: 'HM',
    role: 'DATA_ANALYST' as const,
    labs: ['RICCC'],
    capacity: 40,
    expertise: ['EHR Data', 'Clinical Analytics', 'REDCap'],
    skills: ['SQL', 'R', 'REDCap', 'Epic Clarity', 'Clinical Data'],
    department: 'Clinical Informatics',
    title: 'Clinical Data Analyst',
  }
];

// Role-based permission matrix
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
    'CLINICAL_RESEARCH_COORDINATOR': {
      canCreateProjects: true,
      canAssignTasks: true,
      canViewAllProjects: true,
      canEditAllProjects: true,
      canManageMembers: false,
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
    },
    'FELLOW': {
      canCreateProjects: true,
      canAssignTasks: false,
      canViewAllProjects: true,
      canEditAllProjects: false,
      canAccessReports: false
    },
    'MEDICAL_STUDENT': {
      canCreateProjects: false,
      canAssignTasks: false,
      canViewAllProjects: false,
      canEditAllProjects: false,
      canAccessReports: false
    },
    'RESEARCH_ASSISTANT': {
      canCreateProjects: false,
      canAssignTasks: false,
      canViewAllProjects: true,
      canEditAllProjects: false,
      canAccessReports: false
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

function generateAvatarColor(initials: string): string {
  const colors = [
    '#8B5CF6', // Purple
    '#22C55E', // Green  
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#F59E0B', // Orange
    '#10B981', // Emerald
    '#6366F1', // Indigo
    '#EC4899', // Pink
  ];
  
  const hash = initials.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export async function seedEnhancedTeam() {
  console.log('🌱 Starting enhanced team seeding...');

  try {
    // Create labs first
    const ricccLab = await db.insert(labs).values({
      shortName: 'RICCC',
      name: 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science',
      fullName: 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science (RICCC)',
      department: 'Internal Medicine - Critical Care',
      description: 'Advancing critical care through innovative research and collaboration',
      primaryColor: '#8B5CF6',
      features: ['projects', 'tasks', 'ideas', 'standups', 'analytics'],
    }).onConflictDoUpdate({
      target: labs.shortName,
      set: {
        name: 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science',
        fullName: 'Rush Interdisciplinary Consortium for Critical Care Trials and Data Science (RICCC)',
        department: 'Internal Medicine - Critical Care',
        description: 'Advancing critical care through innovative research and collaboration',
        primaryColor: '#8B5CF6',
        features: ['projects', 'tasks', 'ideas', 'standups', 'analytics'],
      }
    }).returning();

    const rhedasLab = await db.insert(labs).values({
      shortName: 'RHEDAS',
      name: 'Rush Health Equity Data Analytics Studio',
      fullName: 'Rush Health Equity Data Analytics Studio (RHEDAS)', 
      department: 'Internal Medicine',
      description: 'Health equity research through data science and analytics',
      primaryColor: '#22C55E',
      features: ['projects', 'tasks', 'analytics', 'reports'],
    }).onConflictDoUpdate({
      target: labs.shortName,
      set: {
        name: 'Rush Health Equity Data Analytics Studio',
        fullName: 'Rush Health Equity Data Analytics Studio (RHEDAS)',
        department: 'Internal Medicine',
        description: 'Health equity research through data science and analytics',
        primaryColor: '#22C55E',
        features: ['projects', 'tasks', 'analytics', 'reports'],
      }
    }).returning();

    console.log('✅ Labs created/updated');

    const labMap = { 
      RICCC: ricccLab[0].id, 
      RHEDAS: rhedasLab[0].id 
    };

    // Create users and lab memberships
    for (const member of ENHANCED_TEAM_ROSTER) {
      const { labs: memberLabs, middleName, expertise, skills, ...userData } = member;
      
      // Create full name
      const fullName = `${member.firstName}${middleName ? ' ' + middleName : ''} ${member.lastName}`;
      
      const user = await db.insert(users).values({
        ...userData,
        name: fullName,
        middleName,
        expertise: expertise || [],
        skills: skills || [],
        avatar: generateAvatarColor(member.initials),
        institution: 'Rush University Medical Center',
      }).onConflictDoUpdate({
        target: users.email,
        set: {
          ...userData,
          name: fullName,
          middleName,
          expertise: expertise || [],
          skills: skills || [],
          avatar: generateAvatarColor(member.initials),
          institution: 'Rush University Medical Center',
        }
      }).returning();

      // Create lab memberships with role-based permissions
      for (const labName of memberLabs) {
        const permissions = getRolePermissions(member.role);
        
        await db.insert(labMembers).values({
          userId: user[0].id,
          labId: labMap[labName],
          ...permissions,
        }).onConflictDoUpdate({
          target: [labMembers.userId, labMembers.labId],
          set: permissions,
        });
      }

      console.log(`✅ Created user: ${fullName} (${memberLabs.join(', ')})`);
    }

    console.log('🎉 Enhanced team seeding completed successfully!');
    console.log(`📊 Created ${ENHANCED_TEAM_ROSTER.length} team members across 2 labs`);
    console.log(`🏥 RICCC: ${ENHANCED_TEAM_ROSTER.filter(m => m.labs.includes('RICCC')).length} members`);
    console.log(`🏥 RHEDAS: ${ENHANCED_TEAM_ROSTER.filter(m => m.labs.includes('RHEDAS')).length} members`);
    console.log(`👥 J.C. Rojas is PI in both labs for maximum flexibility`);

  } catch (error) {
    console.error('❌ Error seeding enhanced team:', error);
    throw error;
  }
}

// Run seeding if called directly (ESM compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  seedEnhancedTeam()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}