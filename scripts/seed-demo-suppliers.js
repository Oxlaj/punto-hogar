const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const supplierDefinitions = [
  { businessName: 'Distribuidora FerreHogar', categories: ['herramientas'] },
  { businessName: 'ElectroSuministros GT', categories: ['electricidad', 'iluminacion'] },
  { businessName: 'Plomería Integral GT', categories: ['plomeria'] },
  { businessName: 'Pinturas y Acabados Central', categories: ['pinturas'] },
  { businessName: 'Casa y Orden Distribuciones', categories: ['cocina', 'organizacion'] },
  { businessName: 'Limpieza Total GT', categories: ['limpieza'] },
  { businessName: 'Jardines y Más', categories: ['jardineria'] },
  { businessName: 'Seguridad Residencial GT', categories: ['seguridad'] }
];

async function main() {
  const categories = await prisma.category.findMany({
    where: { slug: { in: [...new Set(supplierDefinitions.flatMap(item => item.categories))] } },
    select: { id: true, slug: true }
  });
  const categoryIds = new Map(categories.map(category => [category.slug, category.id]));
  const missingCategories = supplierDefinitions.flatMap(item => item.categories.filter(slug => !categoryIds.has(slug)));
  if (missingCategories.length) throw new Error(`Categorías faltantes: ${missingCategories.join(', ')}`);

  const activeProducts = await prisma.product.findMany({
    where: { active: true },
    select: { id: true, name: true, slug: true, category: { select: { slug: true } } },
    orderBy: { slug: 'asc' }
  });
  if (activeProducts.length !== 30) throw new Error(`Se esperaban 30 productos activos; se encontraron ${activeProducts.length}`);

  const supplierIds = new Map();
  for (const definition of supplierDefinitions) {
    const supplier = await prisma.supplier.upsert({
      where: { businessName: definition.businessName },
      update: { isDemo: true },
      create: {
        businessName: definition.businessName,
        isDemo: true,
        notes: 'Proveedor ficticio de demostración.'
      },
      select: { id: true, businessName: true }
    });
    supplierIds.set(definition.businessName, supplier.id);
  }

  const categorySupplier = new Map();
  for (const definition of supplierDefinitions) {
    for (const category of definition.categories) categorySupplier.set(category, supplierIds.get(definition.businessName));
  }

  const unmatched = activeProducts.filter(product => !categorySupplier.has(product.category.slug));
  if (unmatched.length) throw new Error(`Productos sin proveedor: ${unmatched.map(product => product.slug).join(', ')}`);

  await prisma.$transaction(async tx => {
    for (const product of activeProducts) {
      const supplierId = categorySupplier.get(product.category.slug);
      await tx.productSupplier.updateMany({
        where: { productId: product.id, isPrimary: true, supplierId: { not: supplierId } },
        data: { isPrimary: false }
      });
      await tx.productSupplier.upsert({
        where: { productId_supplierId: { productId: product.id, supplierId } },
        update: { isPrimary: true },
        create: { productId: product.id, supplierId, isPrimary: true }
      });
    }
  });

  const [supplierCount, primaryCount, purchaseCount, movementCount] = await Promise.all([
    prisma.supplier.count({ where: { isDemo: true } }),
    prisma.productSupplier.count({ where: { isPrimary: true, product: { active: true } } }),
    prisma.purchase.count(),
    prisma.inventoryMovement.count()
  ]);
  if (supplierCount !== 8 || primaryCount !== 30 || purchaseCount !== 0 || movementCount !== 0) {
    throw new Error(`Verificación fallida: proveedores=${supplierCount}, principales=${primaryCount}, compras=${purchaseCount}, movimientos=${movementCount}`);
  }
  console.log(JSON.stringify({ demoSuppliers: supplierCount, activeProducts: activeProducts.length, primaryRelations: primaryCount, purchases: purchaseCount, inventoryMovements: movementCount }));
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
