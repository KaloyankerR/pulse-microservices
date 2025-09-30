const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Example: Create some test user cache entries
  // In production, this would be synced from User Service via events
  
  const users = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      username: 'john_doe',
      displayName: 'John Doe',
      avatarUrl: 'https://i.pravatar.cc/150?u=john',
      verified: true,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      username: 'jane_smith',
      displayName: 'Jane Smith',
      avatarUrl: 'https://i.pravatar.cc/150?u=jane',
      verified: false,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      username: 'bob_wilson',
      displayName: 'Bob Wilson',
      avatarUrl: 'https://i.pravatar.cc/150?u=bob',
      verified: false,
    },
  ];

  for (const user of users) {
    await prisma.userCache.upsert({
      where: { id: user.id },
      update: user,
      create: user,
    });
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

