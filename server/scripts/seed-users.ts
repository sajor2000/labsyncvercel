import 'dotenv/config';
import { db } from '../db';
import { users, labs } from '@shared/schema';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { eq } from 'drizzle-orm';

interface UserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  name: string;
  role: string;
  phone?: string;
  is_active: boolean;
  capacity: string;
  middle_name?: string;
  initials: string;
  title?: string;
  department?: string;
  institution: string;
  avatar?: string;
  bio?: string;
  linkedin_url?: string;
  orcid?: string;
  expertise: string[];
  skills: string[];
  is_external: boolean;
}

async function seedUsers() {
  try {
    console.log('🌱 Starting user seeding process...');
    
    // Read the users.json file
    const usersJsonPath = path.join(process.cwd(), 'users.json');
    const usersData: UserData[] = JSON.parse(fs.readFileSync(usersJsonPath, 'utf8'));
    
    console.log(`📖 Found ${usersData.length} users in users.json`);
    
    // Create RICCC and RHEDAS labs if they don't exist
    const [ricccLab] = await db.insert(labs).values({
      id: 'riccc',
      name: 'RICCC',
      description: 'Research in Critical Care and Consciousness',
      institution: 'Rush University Medical Center',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoNothing().returning();
    
    const [rhedasLab] = await db.insert(labs).values({
      id: 'rhedas', 
      name: 'RHEDAS',
      description: 'Research in Health Equity and Data Science',
      institution: 'Rush University Medical Center',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoNothing().returning();
    
    console.log('✅ Labs created/verified: RICCC and RHEDAS');
    
    let usersCreated = 0;
    let usersUpdated = 0;
    
    for (const userData of usersData) {
      try {
        // Generate a temporary password for each user
        const tempPassword = `Rush${userData.initials}2025!`;
        const passwordHash = await bcrypt.hash(tempPassword, 12);
        
        // Check if user already exists
        const existingUser = await db.select().from(users).where(eq(users.email, userData.email)).limit(1);
        
        if (existingUser.length > 0) {
          // Update existing user with new auth fields
          await db.update(users)
            .set({
              firstName: userData.first_name,
              lastName: userData.last_name,
              name: userData.name,
              role: userData.role,
              phone: userData.phone || null,
              isActive: userData.is_active,
              capacity: userData.capacity,
              middleName: userData.middle_name || null,
              initials: userData.initials,
              title: userData.title || null,
              department: userData.department || null,
              institution: userData.institution,
              avatar: userData.avatar || null,
              bio: userData.bio || null,
              linkedInUrl: userData.linkedin_url || null,
              orcid: userData.orcid || null,
              expertise: userData.expertise,
              skills: userData.skills,
              isExternal: userData.is_external,
              passwordHash,
              isTemporaryPassword: true,
              updatedAt: new Date(),
              // Assign to RICCC lab for now (can be updated later)
              labId: 'riccc'
            })
            .where(eq(users.id, userData.id));
          
          usersUpdated++;
          console.log(`📝 Updated user: ${userData.name} (${userData.email})`);
        } else {
          // Create new user
          await db.insert(users).values({
            id: userData.id,
            email: userData.email,
            firstName: userData.first_name,
            lastName: userData.last_name,
            name: userData.name,
            role: userData.role,
            phone: userData.phone || null,
            isActive: userData.is_active,
            capacity: userData.capacity,
            middleName: userData.middle_name || null,
            initials: userData.initials,
            title: userData.title || null,
            department: userData.department || null,
            institution: userData.institution,
            avatar: userData.avatar || null,
            bio: userData.bio || null,
            linkedInUrl: userData.linkedin_url || null,
            orcid: userData.orcid || null,
            expertise: userData.expertise,
            skills: userData.skills,
            isExternal: userData.is_external,
            passwordHash,
            isTemporaryPassword: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Assign to RICCC lab for now (can be updated later)
            labId: 'riccc'
          });
          
          usersCreated++;
          console.log(`✅ Created user: ${userData.name} (${userData.email}) - Password: ${tempPassword}`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing user ${userData.name}:`, error);
      }
    }
    
    console.log('\n🎉 User seeding completed!');
    console.log(`✅ Users created: ${usersCreated}`);
    console.log(`📝 Users updated: ${usersUpdated}`);
    console.log('\n📋 Temporary passwords generated for all users:');
    console.log('Format: Rush[Initials]2025!');
    console.log('Example: For J.C. Rojas (JR) → RushJR2025!');
    console.log('\n⚠️  Users should change their passwords on first login.');
    
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  }
}

// Run the seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedUsers().then(() => {
    console.log('🏁 Seeding process finished');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });
}

export default seedUsers;