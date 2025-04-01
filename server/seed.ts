import { db } from './db';
import { users } from '@shared/schema';
import bcrypt from 'bcrypt';

export async function seedUsers() {
  try {
    // Check if users already exist
    const existingUsers = await db.select().from(users);
    
    // Don't seed if there are already users
    if (existingUsers.length > 0) {
      console.log('Users already exist, skipping seed');
      return;
    }

    // Create admin user with administrator role
    const adminPassword = await bcrypt.hash('admin123', 10);
    await db.insert(users).values({
      username: 'admin',
      password: adminPassword,
      fullName: 'Admin User',
      position: 'System Administrator',
      office: 'VAWC Office',
      role: 'administrator'
    });

    // Create editor user with editor role
    const editorPassword = await bcrypt.hash('editor123', 10);
    await db.insert(users).values({
      username: 'editor',
      password: editorPassword,
      fullName: 'Editor User',
      position: 'Case Encoder',
      office: 'VAWC Office',
      role: 'editor'
    });

    console.log('Users seeded successfully');
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
}