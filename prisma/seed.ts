import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function upsertUser({ email, name, password, role }: { email: string; name: string; password: string; role: Role }) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role },
    create: { email, name, passwordHash, role }
  });
}

function randomPrice(): number {
  return Number((Math.random() * 118 + 2).toFixed(2));
}

function slugify(base: string): string {
  return base
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const userPassword = process.env.SEED_USER_PASSWORD;
  if (!adminPassword || !userPassword) {
    throw new Error('SEED_ADMIN_PASSWORD y SEED_USER_PASSWORD son obligatorias para ejecutar este seed.');
  }

  console.log('Seeding categorías...');
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'alimento' },
      update: {},
      create: { name: 'Alimento', slug: 'alimento' }
    }),
    prisma.category.upsert({
      where: { slug: 'juguetes' },
      update: {},
      create: { name: 'Juguetes', slug: 'juguetes' }
    }),
    prisma.category.upsert({
      where: { slug: 'accesorios' },
      update: {},
      create: { name: 'Accesorios', slug: 'accesorios' }
    })
  ]);

  console.log('Seeding usuarios...');
  const admin = await upsertUser({
    name: 'admin',
    email: 'admin@test.com',
    password: adminPassword,
    role: Role.ADMIN
  });
  const user = await upsertUser({
    name: 'test',
    email: 'test@test.com',
    password: userPassword,
    role: Role.USER
  });

  console.log('Generando productos (500)...');
  const productData: any[] = [];
  const catIds = categories.map(c => c.id);
  for (let i = 1; i <= 500; i++) {
    const baseName = `Producto ${i}`;
    const slug = slugify(baseName);
    const categoryId = catIds[i % catIds.length];
    productData.push({
      name: baseName,
      slug,
      description: `Descripción del ${baseName}`,
      price: randomPrice(),
      imageUrl: '/images/noimage.webp',
      categoryId,
      userId: i % 5 === 0 ? admin.id : user.id,
      active: true
    });
  }

  const batchSize = 100;
  for (let start = 0; start < productData.length; start += batchSize) {
    const batch = productData.slice(start, start + batchSize);
    await prisma.product.createMany({ data: batch, skipDuplicates: true });
    console.log(`Insertados hasta: ${start + batch.length}`);
  }
  console.log('Seed completado.');
}

main()
  .catch(e => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
