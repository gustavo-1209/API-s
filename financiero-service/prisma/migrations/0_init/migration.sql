-- CreateEnum
CREATE TYPE "pago_status" AS ENUM ('PENDIENTE', 'COMPLETADO', 'FALLIDO', 'REEMBOLSADO');

-- CreateTable
CREATE TABLE "pagos" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "reserva_id" UUID,
    "monto" DECIMAL(10,2),
    "metodo_pago" TEXT,
    "referencia" TEXT,
    "status" "pago_status" DEFAULT 'PENDIENTE',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturas" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "reserva_id" UUID,
    "pago_id" UUID,
    "numero_factura" TEXT,
    "ruc_cliente" TEXT,
    "razon_social" TEXT,
    "subtotal" DECIMAL(10,2),
    "iva" DECIMAL(10,2),
    "total" DECIMAL(10,2),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_factura" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "factura_id" UUID,
    "descripcion" TEXT,
    "cantidad" INTEGER DEFAULT 1,
    "precio_unit" DECIMAL(10,2),
    "subtotal" DECIMAL(10,2),

    CONSTRAINT "detalle_factura_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "facturas_pago_id_key" ON "facturas"("pago_id");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_numero_factura_key" ON "facturas"("numero_factura");

-- AddForeignKey
ALTER TABLE "detalle_factura" ADD CONSTRAINT "detalle_factura_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

