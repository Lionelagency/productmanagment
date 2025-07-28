const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@taskflow.com',
      name: 'System Administrator',
      password: adminPassword,
      role: 'ADMIN'
    }
  });

  // Create product users
  const productPassword = await bcrypt.hash('product123', 12);
  const productUser1 = await prisma.user.create({
    data: {
      email: 'alice@taskflow.com',
      name: 'Alice Johnson',
      password: productPassword,
      role: 'PRODUCT'
    }
  });

  const productUser2 = await prisma.user.create({
    data: {
      email: 'mike@taskflow.com',
      name: 'Mike Chen',
      password: productPassword,
      role: 'PRODUCT'
    }
  });

  // Create client users
  const clientPassword = await bcrypt.hash('client123', 12);
  const clients = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john@client.com',
        name: 'John Doe',
        password: clientPassword,
        role: 'CLIENT'
      }
    }),
    prisma.user.create({
      data: {
        email: 'jane@client.com',
        name: 'Jane Smith',
        password: clientPassword,
        role: 'CLIENT'
      }
    }),
    prisma.user.create({
      data: {
        email: 'bob@client.com',
        name: 'Bob Wilson',
        password: clientPassword,
        role: 'CLIENT'
      }
    })
  ]);

  console.log('Database seeded successfully!');
  console.log('Admin credentials: admin@taskflow.com / admin123');
  console.log('Product user credentials: alice@taskflow.com / product123');
  console.log('Client credentials: john@client.com / client123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });