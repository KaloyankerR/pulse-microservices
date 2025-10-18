const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pulse.com' },
    update: {},
    create: {
      email: 'admin@pulse.com',
      username: 'admin',
      passwordHash: adminPassword,
      displayName: 'Admin User',
      bio: 'System administrator',
      verified: true,
    },
  });

  console.log('Admin user created:', { id: admin.id, email: admin.email });

  // Create sample users
  const sampleUsers = [
    {
      email: 'john.doe@example.com',
      username: 'johndoe',
      passwordHash: await bcrypt.hash('Password123!', 12),
      displayName: 'John Doe',
      bio: 'Software developer passionate about technology',
      verified: false,
    },
    {
      email: 'jane.smith@example.com',
      username: 'janesmith',
      passwordHash: await bcrypt.hash('Password123!', 12),
      displayName: 'Jane Smith',
      bio: 'UI/UX Designer with a love for beautiful interfaces',
      verified: true,
    },
    {
      email: 'mike.johnson@example.com',
      username: 'mikej',
      passwordHash: await bcrypt.hash('Password123!', 12),
      displayName: 'Mike Johnson',
      bio: 'Product manager and coffee enthusiast',
      verified: false,
    },
    {
      email: 'sarah.wilson@example.com',
      username: 'sarahw',
      passwordHash: await bcrypt.hash('Password123!', 12),
      displayName: 'Sarah Wilson',
      bio: 'Marketing specialist and social media expert',
      verified: true,
    },
  ];

  const createdUsers = [];
  for (const userData of sampleUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });
    createdUsers.push(user);
    console.log('Sample user created:', { id: user.id, email: user.email });
  }

  // Create some follow relationships
  if (createdUsers.length >= 4) {
    const followRelations = [
      { followerId: createdUsers[0].id, followingId: createdUsers[1].id }, // john follows jane
      { followerId: createdUsers[0].id, followingId: createdUsers[2].id }, // john follows mike
      { followerId: createdUsers[1].id, followingId: createdUsers[0].id }, // jane follows john
      { followerId: createdUsers[1].id, followingId: createdUsers[3].id }, // jane follows sarah
      { followerId: createdUsers[2].id, followingId: createdUsers[1].id }, // mike follows jane
      { followerId: createdUsers[3].id, followingId: createdUsers[0].id }, // sarah follows john
      { followerId: createdUsers[3].id, followingId: createdUsers[1].id }, // sarah follows jane
    ];

    for (const relation of followRelations) {
      await prisma.userFollow.upsert({
        where: {
          followerId_followingId: {
            followerId: relation.followerId,
            followingId: relation.followingId,
          },
        },
        update: {},
        create: relation,
      });
    }

    console.log('Follow relationships created');
  }

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

