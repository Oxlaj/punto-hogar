const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function upsertUser({ email, name, password, role }) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role },
    create: { email, name, passwordHash, role }
  });
}

function randomPrice() {
  // precios entre 2.00 y 120.00 con 2 decimales
  return Number((Math.random() * 118 + 2).toFixed(2));
}

function slugify(base) {
  return base
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function runSeed() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const userPassword = process.env.SEED_USER_PASSWORD;
  if (!adminPassword || !userPassword) {
    throw new Error('SEED_ADMIN_PASSWORD y SEED_USER_PASSWORD son obligatorias para ejecutar este seed.');
  }

  console.log('Seeding categorías...');
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'alimento' },
      update: { imageUrl: '/images/alimento.jpg' },
      create: { name: 'Alimento', slug: 'alimento', imageUrl: '/images/alimento.jpg' }
    }),
    prisma.category.upsert({
      where: { slug: 'juguetes' },
      update: { imageUrl: '/images/juguetes.jpg' },
      create: { name: 'Juguetes', slug: 'juguetes', imageUrl: '/images/juguetes.jpg' }
    }),
    prisma.category.upsert({
      where: { slug: 'accesorios' },
      update: { imageUrl: '/images/accesorios.jpg' },
      create: { name: 'Accesorios', slug: 'accesorios', imageUrl: '/images/accesorios.jpg' }
    })
  ]);

  console.log('Seeding usuarios...');
  const admin = await upsertUser({
    name: 'admin',
    email: 'admin@test.com',
    password: adminPassword,
    role: 'ADMIN'
  });
  const user = await upsertUser({
    name: 'test',
    email: 'test@test.com',
    password: userPassword,
    role: 'USER'
  });

  console.log('Generando productos (500)...');
  // Para evitar exceder límite de createMany con objetos duplicados por slug,
  // generamos slugs deterministas y únicos.
  const productData = [];
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
      userId: i % 5 === 0 ? admin.id : user.id, // algunos asignados al admin
      active: true
    });
  }

  // Dividir en lotes para no saturar (por si en algún motor hay límites)
  const batchSize = 100;
  for (let start = 0; start < productData.length; start += batchSize) {
    const batch = productData.slice(start, start + batchSize);
    await prisma.product.createMany({ data: batch, skipDuplicates: true });
    console.log(`Insertados hasta: ${start + batch.length}`);
  }

  // ------------------------------------------------------------------
  // Generación de ÓRDENES de prueba (distribución 2 años hacia atrás)
  // ------------------------------------------------------------------
  const existingOrders = await prisma.order.count();
  if (existingOrders > 0) {
    console.log(`Órdenes existentes (${existingOrders}) -> se omite generación de órdenes.`);
  } else {
    console.log('Generando órdenes de prueba: 6 por día (2 años hacia atrás)...');

    // Traer un subconjunto de productos para acelerar (ej: primeros 120)
    const products = await prisma.product.findMany({
      take: 120,
      orderBy: { createdAt: 'asc' },
      select: { id: true, price: true, name: true, slug: true }
    });

    if (products.length === 0) {
      console.warn('No hay productos, no se pueden generar órdenes.');
    } else {
      const end = new Date();
      const startRange = new Date();
      startRange.setFullYear(end.getFullYear() - 2);
      startRange.setHours(0,0,0,0);

      // Distribución de estados (ponderada)
      const STATUS_WEIGHTS = [
        { status: 'COMPLETED', w: 40 },
        { status: 'PAID', w: 20 },
        { status: 'SHIPPED', w: 15 },
        { status: 'PENDING', w: 15 },
        { status: 'CANCELED', w: 10 }
      ];
      const weightSum = STATUS_WEIGHTS.reduce((a, b) => a + b.w, 0);
      function pickStatus(r) {
        let acc = 0;
        for (const s of STATUS_WEIGHTS) {
          acc += s.w;
          if (r * weightSum < acc) return s.status;
        }
        return 'PENDING';
      }

      function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

      const ordersToCreate = [];
      // Recorremos día por día y generamos 6 órdenes por día
      for (let d = new Date(startRange.getTime()); d <= end; d.setDate(d.getDate() + 1)) {
        const year = d.getFullYear();
        const month = d.getMonth();
        const day = d.getDate();
        const ORDERS_PER_DAY = 6;
        for (let i = 0; i < ORDERS_PER_DAY; i++) {
          const createdAt = new Date(year, month, day, randomInt(0, 23), randomInt(0, 59), randomInt(0, 59));
          const itemCount = randomInt(1, 4);
          const usedIdx = new Set();
          const items = [];
          for (let j = 0; j < itemCount; j++) {
            let pIdx;
            let loopSafe = 0;
            do {
              pIdx = randomInt(0, products.length - 1);
              loopSafe++;
              if (loopSafe > 10) break;
            } while (usedIdx.has(pIdx));
            usedIdx.add(pIdx);
            const p = products[pIdx];
            const quantity = randomInt(1, 5);
            items.push({ productId: p.id, name: p.name, slug: p.slug, unitPrice: p.price, quantity });
          }
          let subtotal = items.reduce((sum, it) => sum + Number(it.unitPrice) * it.quantity, 0);
          const shipping = Math.random() < 0.7 ? Number((Math.random() * 8 + 2).toFixed(2)) : 0;
          subtotal = Number(subtotal.toFixed(2));
          const total = Number((subtotal + shipping).toFixed(2));
          const status = pickStatus(Math.random());
          const customerIndex = randomInt(1, 1200);
          const customerName = `Cliente ${customerIndex}`;
          const phone = `+34${randomInt(600000000, 699999999)}`;
          ordersToCreate.push({
            customer: customerName,
            email: `cliente${customerIndex}@test.com`,
            address: `Dirección ${customerIndex}, Ciudad Demo`,
            subtotal,
            total,
            createdAt,
            phone,
            status,
            items
          });
        }
      }

      console.log(`Preparadas ${ordersToCreate.length} órdenes. Insertando...`);

      // Insert secuencial (transacciones por lote para no saturar)
      const orderBatchSize = 40;
      for (let start = 0; start < ordersToCreate.length; start += orderBatchSize) {
        const slice = ordersToCreate.slice(start, start + orderBatchSize);
        await prisma.$transaction(
          slice.map(o =>
            prisma.order.create({
              data: {
                customer: o.customer,
                email: o.email,
                address: o.address,
                subtotal: o.subtotal,
                total: o.total,
                createdAt: o.createdAt,
                phone: o.phone,
                status: o.status,
                // Items
                items: { create: o.items }
              }
            })
          )
        );
        console.log(`Órdenes insertadas: ${Math.min(start + orderBatchSize, ordersToCreate.length)}`);
      }
    }
  }

  console.log('Seed completado.');
}

// Export para uso programático
module.exports = { runSeed };

// Ejecución directa desde CLI
if (require.main === module) {
  runSeed()
    .catch(e => {
      console.error('Error en seed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
