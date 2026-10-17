-- CreateEnum
CREATE TYPE "public"."PurchaseStatus" AS ENUM ('PENDING', 'RECEIVED');

-- CreateEnum
CREATE TYPE "public"."InventoryMovementType" AS ENUM ('PURCHASE_RECEIPT');

-- CreateTable
CREATE TABLE "public"."Supplier" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "nit" TEXT,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductSupplier" (
    "productId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductSupplier_pkey" PRIMARY KEY ("productId","supplierId")
);

-- CreateTable
CREATE TABLE "public"."Purchase" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "status" "public"."PurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedAt" TIMESTAMP(3),
    "invoiceReference" TEXT,
    "total" DECIMAL(12,2) NOT NULL,
    "createdById" TEXT NOT NULL,
    "receivedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PurchaseItem" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "purchaseQuantity" INTEGER NOT NULL,
    "purchaseUnit" TEXT NOT NULL,
    "inventoryUnit" TEXT NOT NULL,
    "conversionFactor" DECIMAL(12,4) NOT NULL,
    "unitCost" DECIMAL(12,2) NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "PurchaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryMovement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "purchaseItemId" TEXT NOT NULL,
    "type" "public"."InventoryMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DECIMAL(12,2) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_businessName_key" ON "public"."Supplier"("businessName");

-- CreateIndex
CREATE INDEX "ProductSupplier_supplierId_idx" ON "public"."ProductSupplier"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSupplier_one_primary_per_product_idx"
ON "public"."ProductSupplier"("productId")
WHERE "isPrimary" = true;

-- CreateIndex
CREATE INDEX "Purchase_supplierId_idx" ON "public"."Purchase"("supplierId");

-- CreateIndex
CREATE INDEX "Purchase_status_idx" ON "public"."Purchase"("status");

-- CreateIndex
CREATE INDEX "Purchase_createdById_idx" ON "public"."Purchase"("createdById");

-- CreateIndex
CREATE INDEX "Purchase_receivedById_idx" ON "public"."Purchase"("receivedById");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseItem_purchaseId_productId_key"
ON "public"."PurchaseItem"("purchaseId","productId");

-- CreateIndex
CREATE INDEX "PurchaseItem_productId_idx" ON "public"."PurchaseItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryMovement_purchaseItemId_key"
ON "public"."InventoryMovement"("purchaseItemId");

-- CreateIndex
CREATE INDEX "InventoryMovement_productId_createdAt_idx"
ON "public"."InventoryMovement"("productId","createdAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_purchaseId_idx" ON "public"."InventoryMovement"("purchaseId");

-- CreateIndex
CREATE INDEX "InventoryMovement_userId_idx" ON "public"."InventoryMovement"("userId");

-- AddCheckConstraint
ALTER TABLE "public"."PurchaseItem"
ADD CONSTRAINT "PurchaseItem_purchaseQuantity_positive"
CHECK ("purchaseQuantity" > 0);

-- AddCheckConstraint
ALTER TABLE "public"."PurchaseItem"
ADD CONSTRAINT "PurchaseItem_conversionFactor_positive"
CHECK ("conversionFactor" > 0);

-- AddCheckConstraint
ALTER TABLE "public"."PurchaseItem"
ADD CONSTRAINT "PurchaseItem_unitCost_nonnegative"
CHECK ("unitCost" >= 0);

-- AddCheckConstraint
ALTER TABLE "public"."PurchaseItem"
ADD CONSTRAINT "PurchaseItem_lineTotal_nonnegative"
CHECK ("lineTotal" >= 0);

-- AddCheckConstraint
ALTER TABLE "public"."InventoryMovement"
ADD CONSTRAINT "InventoryMovement_quantity_positive"
CHECK ("quantity" > 0);

-- AddCheckConstraint
ALTER TABLE "public"."InventoryMovement"
ADD CONSTRAINT "InventoryMovement_unitCost_nonnegative"
CHECK ("unitCost" >= 0);

-- AddForeignKey
ALTER TABLE "public"."ProductSupplier"
ADD CONSTRAINT "ProductSupplier_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductSupplier"
ADD CONSTRAINT "ProductSupplier_supplierId_fkey"
FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Purchase"
ADD CONSTRAINT "Purchase_supplierId_fkey"
FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Purchase"
ADD CONSTRAINT "Purchase_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Purchase"
ADD CONSTRAINT "Purchase_receivedById_fkey"
FOREIGN KEY ("receivedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseItem"
ADD CONSTRAINT "PurchaseItem_purchaseId_fkey"
FOREIGN KEY ("purchaseId") REFERENCES "public"."Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseItem"
ADD CONSTRAINT "PurchaseItem_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryMovement"
ADD CONSTRAINT "InventoryMovement_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryMovement"
ADD CONSTRAINT "InventoryMovement_purchaseId_fkey"
FOREIGN KEY ("purchaseId") REFERENCES "public"."Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryMovement"
ADD CONSTRAINT "InventoryMovement_purchaseItemId_fkey"
FOREIGN KEY ("purchaseItemId") REFERENCES "public"."PurchaseItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryMovement"
ADD CONSTRAINT "InventoryMovement_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
