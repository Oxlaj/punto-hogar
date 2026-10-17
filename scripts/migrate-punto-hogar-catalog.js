const path = require('path');
const { PrismaClient } = require('@prisma/client');

if (!process.env.DATABASE_URL && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(path.resolve(process.cwd(), '.env'));
}

const prisma = new PrismaClient();

const categories = [
  { name: 'Herramientas', slug: 'herramientas' },
  { name: 'Electricidad', slug: 'electricidad' },
  { name: 'Plomería', slug: 'plomeria' },
  { name: 'Pinturas', slug: 'pinturas' },
  { name: 'Organización', slug: 'organizacion' },
  { name: 'Cocina', slug: 'cocina' },
  { name: 'Limpieza', slug: 'limpieza' },
  { name: 'Iluminación', slug: 'iluminacion' },
  { name: 'Jardinería', slug: 'jardineria' },
  { name: 'Seguridad', slug: 'seguridad' }
];

const products = [
  ['Martillo de uña 16 oz', 'herramientas', 'Martillo de acero con mango ergonómico para trabajos de reparación.', 89.00],
  ['Juego de destornilladores 6 piezas', 'herramientas', 'Set de destornilladores planos y Phillips para uso doméstico.', 119.00],
  ['Cinta métrica de 5 metros', 'herramientas', 'Cinta métrica retráctil con graduación clara y seguro de bloqueo.', 45.00],
  ['Llave ajustable de 10 pulgadas', 'herramientas', 'Llave inglesa ajustable para reparaciones y mantenimiento general.', 75.00],
  ['Extensión eléctrica de 5 metros', 'electricidad', 'Extensión con cable reforzado para uso doméstico y de taller.', 95.00],
  ['Regleta eléctrica de 6 tomas', 'electricidad', 'Regleta con interruptor y protección para equipos del hogar.', 125.00],
  ['Cable eléctrico calibre 12, 10 metros', 'electricidad', 'Cable para instalaciones eléctricas residenciales y proyectos.', 165.00],

  ['Llave de paso de 1/2 pulgada', 'plomeria', 'Llave de paso de latón para controlar instalaciones de agua.', 42.00],
  ['Cinta de teflón para tubería', 'plomeria', 'Cinta selladora para conexiones roscadas de agua y aire.', 12.00],
  ['Sifón flexible para fregadero', 'plomeria', 'Sifón ajustable para instalaciones de fregadero doméstico.', 58.00],

  ['Pintura látex blanca 1 galón', 'pinturas', 'Pintura lavable para interiores con acabado mate.', 185.00],
  ['Rodillo para pintura de 9 pulgadas', 'pinturas', 'Rodillo de felpa para aplicar pintura de forma uniforme.', 38.00],
  ['Brocha profesional de 3 pulgadas', 'pinturas', 'Brocha de cerdas resistentes para trabajos de pintura.', 29.00],

  ['Caja organizadora plástica de 12 litros', 'organizacion', 'Caja apilable con tapa para guardar artículos del hogar.', 55.00],
  ['Estantería metálica de 4 niveles', 'organizacion', 'Estantería resistente para almacenar herramientas y suministros.', 349.00],
  ['Set de recipientes herméticos 5 piezas', 'cocina', 'Recipientes apilables para conservar alimentos en la cocina.', 99.00],
  ['Sartén antiadherente de 24 cm', 'cocina', 'Sartén de uso diario con recubrimiento antiadherente.', 145.00],
  ['Tabla de cortar de bambú', 'cocina', 'Tabla durable de bambú para preparar alimentos.', 79.00],

  ['Detergente líquido para ropa 1 litro', 'limpieza', 'Detergente concentrado para ropa blanca y de color.', 48.00],
  ['Escoba multiuso con recogedor', 'limpieza', 'Kit para limpieza diaria de pisos y superficies.', 65.00],
  ['Guantes de limpieza reutilizables', 'limpieza', 'Guantes resistentes para proteger las manos durante la limpieza.', 22.00],

  ['Bombilla LED luz cálida 9 W', 'iluminacion', 'Bombilla LED de bajo consumo para espacios interiores.', 32.00],
  ['Lámpara de escritorio LED', 'iluminacion', 'Lámpara ajustable con iluminación LED para estudio u oficina.', 159.00],
  ['Reflector LED exterior 50 W', 'iluminacion', 'Reflector resistente para patios, entradas y áreas exteriores.', 225.00],

  ['Manguera de jardín de 15 metros', 'jardineria', 'Manguera flexible para riego y limpieza exterior.', 175.00],
  ['Tijera para podar', 'jardineria', 'Tijera de poda con hojas de acero para mantenimiento del jardín.', 85.00],
  ['Pala de jardín manual', 'jardineria', 'Pala compacta para plantar y trabajar la tierra.', 35.00],

  ['Candado laminado de 40 mm', 'seguridad', 'Candado resistente para proteger puertas, portones y gabinetes.', 59.00],
  ['Cerradura de pomo para interior', 'seguridad', 'Cerradura de pomo para puertas interiores del hogar.', 135.00],
  ['Detector de humo', 'seguridad', 'Detector de humo con alarma sonora para espacios interiores.', 165.00]
].map(([name, categorySlug, description, price]) => ({
  name,
  slug: name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, ''),
  description,
  price,
  categorySlug,
  stock: 25,
  imageUrl: null
}));

const legacySlugs = Array.from({ length: 500 }, (_, index) => `producto-${index + 1}`);
const applyChanges = process.argv.includes('--apply');

async function preview() {
  const legacyProducts = await prisma.product.findMany({
    where: { slug: { in: legacySlugs } },
    select: { id: true, name: true, slug: true, active: true, stock: true },
    orderBy: { slug: 'asc' }
  });
  const existingCategories = await prisma.category.findMany({
    where: { slug: { in: categories.map(category => category.slug) } },
    select: { id: true, name: true, slug: true }
  });
  const existingProducts = await prisma.product.findMany({
    where: { slug: { in: products.map(product => product.slug) } },
    select: { id: true, name: true, slug: true, active: true, stock: true }
  });

  console.log(JSON.stringify({
    mode: applyChanges ? 'apply' : 'preview',
    legacyProductsToDeactivate: legacyProducts.length,
    legacyProductsAlreadyInactive: legacyProducts.filter(product => !product.active).length,
    categoriesToCreateOrUpdate: categories.length,
    categoriesAlreadyExisting: existingCategories.length,
    productsToCreateOrUpdate: products.length,
    productsAlreadyExisting: existingProducts.length,
    newProductsStock: 25,
    newProductsWithoutRabbitImages: products.filter(product => product.imageUrl === null).length
  }, null, 2));
}

async function apply() {
  await prisma.$transaction(async transaction => {
    const categoryBySlug = new Map();
    for (const category of categories) {
      const saved = await transaction.category.upsert({
        where: { slug: category.slug },
        update: { name: category.name, active: true },
        create: { name: category.name, slug: category.slug, active: true }
      });
      categoryBySlug.set(category.slug, saved.id);
    }

    await transaction.product.updateMany({
      where: { slug: { in: legacySlugs } },
      data: { active: false }
    });

    for (const product of products) {
      await transaction.product.upsert({
        where: { slug: product.slug },
        update: {
          name: product.name,
          description: product.description,
          price: product.price,
          categoryId: categoryBySlug.get(product.categorySlug),
          stock: product.stock,
          active: true,
          imageUrl: product.imageUrl
        },
        create: {
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          categoryId: categoryBySlug.get(product.categorySlug),
          stock: product.stock,
          active: true,
          imageUrl: product.imageUrl
        }
      });
    }
  });
}

async function main() {
  await preview();
  if (!applyChanges) {
    console.log('No se modificó PostgreSQL. Usa --apply para aplicar este cambio explícitamente.');
    return;
  }
  await apply();
  console.log('Catálogo de Punto Hogar aplicado correctamente.');
}

main()
  .catch(error => {
    console.error('Error en la migración del catálogo:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
