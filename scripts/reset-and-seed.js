// Limpia datos (no estructura) y vuelve a poblar con el seeder.
// Ejecuta con Node (JS) y respeta claves foráneas al borrar en orden.

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const { spawn } = require('child_process');

const prisma = new PrismaClient();

async function truncateData() {
  console.log('Limpiando datos...');
  // Orden seguro de borrado según relaciones del schema.prisma
  // Hijo -> Padre
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});

  await prisma.auditLog.deleteMany({});

  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});

  await prisma.userRole.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.roleEntity.deleteMany({});

  await prisma.user.deleteMany({});

  console.log('Datos limpiados.');
}

function runNodeScript(relativePath) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, relativePath);
    const cp = spawn(process.execPath, [scriptPath], { stdio: 'inherit' });
    cp.on('error', reject);
    cp.on('exit', code => {
      if (code === 0) resolve();
      else reject(new Error(`Script failed: ${relativePath} (exit ${code})`));
    });
  });
}

async function main() {
  try {
    await truncateData();
    // Ejecutar seed principal (usuarios, categorías, productos, órdenes)
    await runNodeScript('../prisma/seed.js');
    // Ejecutar seed de RBAC (permisos/roles y asignaciones)
    await runNodeScript('../prisma/seed-rbac.js');
    console.log('Reset + seed completado.');
  } catch (e) {
    console.error('Error en reset-and-seed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
