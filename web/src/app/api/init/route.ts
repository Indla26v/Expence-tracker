import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Initialize database tables and seed default user
async function initializeDatabase() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check if user table has records
    const userCount = await prisma.user.count();
    
    if (userCount === 0) {
      // Create default user
      await prisma.user.create({
        data: {
          email: process.env.APP_USER_EMAIL || 'test@example.com',
          password: process.env.APP_USER_PASSWORD_HASH || '',
        },
      });
      return { status: 'initialized', message: 'Database initialized with default user' };
    }
    
    return { status: 'ready', message: 'Database already initialized' };
  } catch (error) {
    console.error('Database init error:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const result = await initializeDatabase();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Database initialization failed' },
      { status: 500 }
    );
  }
}
