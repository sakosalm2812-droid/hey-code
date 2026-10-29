import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const adminEmail = 'admin@hey.ai';
  const adminPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin User',
      passwordHash: adminPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });

  await prisma.userPreferences.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });

  await prisma.subscription.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      plan: 'ENTERPRISE',
      status: 'ACTIVE',
    },
  });

  const demoEmail = 'demo@hey.ai';
  const demoPassword = await bcrypt.hash('demo1234', 12);

  const demo = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      name: 'Demo User',
      passwordHash: demoPassword,
      role: 'USER',
      emailVerified: new Date(),
    },
  });

  await prisma.userPreferences.upsert({
    where: { userId: demo.id },
    update: {},
    create: { userId: demo.id },
  });

  await prisma.subscription.upsert({
    where: { userId: demo.id },
    update: {},
    create: {
      userId: demo.id,
      plan: 'PRO',
      status: 'ACTIVE',
    },
  });

  const chat = await prisma.chat.create({
    data: {
      userId: demo.id,
      title: 'Welcome to HEY!',
      model: 'GPT_4O',
      systemPrompt: 'You are HEY, a helpful AI assistant like Jarvis.',
    },
  });

  await prisma.message.createMany({
    data: [
      {
        chatId: chat.id,
        userId: demo.id,
        role: 'assistant',
        content: 'Hello! I\'m HEY, your AI assistant. How can I help you today?',
        tokens: 25,
        model: 'GPT-4o',
      },
      {
        chatId: chat.id,
        userId: demo.id,
        role: 'user',
        content: 'What can you do?',
        tokens: 10,
      },
      {
        chatId: chat.id,
        userId: demo.id,
        role: 'assistant',
        content: 'I can help with coding, writing, analysis, creative tasks, and much more! Just ask me anything.',
        tokens: 35,
        model: 'GPT-4o',
      },
    ],
  });

  await prisma.usage.upsert({
    where: { userId_date: { userId: demo.id, date: new Date() } },
    update: { messagesCount: 3, tokensUsed: 70 },
    create: { userId: demo.id, date: new Date(), messagesCount: 3, tokensUsed: 70 },
  });

  await prisma.featureFlag.upsert({
    where: { userId_key: { userId: demo.id, key: 'voice_input' } },
    update: { enabled: true },
    create: { userId: demo.id, key: 'voice_input', enabled: true },
  });

  await prisma.featureFlag.upsert({
    where: { userId_key: { userId: demo.id, key: 'file_upload' } },
    update: { enabled: true },
    create: { userId: demo.id, key: 'file_upload', enabled: true },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`Admin: ${adminEmail} / admin123`);
  console.log(`Demo: ${demoEmail} / demo1234`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });