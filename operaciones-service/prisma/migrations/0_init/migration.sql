-- CreateEnum
CREATE TYPE "reserva_status" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'ACTIVA', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "alquiler_status" AS ENUM ('ACTIVO', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "outbox_status" AS ENUM ('PENDIENTE', 'PROCESADO', 'FALLIDO');

-- CreateTable
CREATE TABLE "seguros" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nombre" TEXT,
    "descripcion" TEXT,
    "precio_dia" DECIMAL(10,2),
    "cobertura" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seguros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canales_venta" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nombre" TEXT,
    "codigo" TEXT,

    CONSTRAINT "canales_venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarifas" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "categoria_id" UUID,
    "nombre" TEXT,
    "precio_dia" DECIMAL(10,2),
    "dias_minimos" INTEGER DEFAULT 1,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tarifas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "correlation_id" UUID DEFAULT uuid_generate_v4(),
    "usuario_id" UUID,
    "vehiculo_id" UUID,
    "agencia_id" UUID,
    "seguro_id" UUID,
    "canal_venta_id" UUID,
    "codigo_reserva" TEXT,
    "fecha_inicio" DATE,
    "fecha_fin" DATE,
    "dias_total" INTEGER,
    "precio_base" DECIMAL(10,2),
    "precio_extras" DECIMAL(10,2) DEFAULT 0,
    "precio_seguro" DECIMAL(10,2) DEFAULT 0,
    "total_amount" DECIMAL(10,2),
    "status" "reserva_status" DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(6),

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserva_extras" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "reserva_id" UUID,
    "extra_id" UUID,
    "cantidad" INTEGER DEFAULT 1,
    "precio_dia" DECIMAL(10,2),
    "subtotal" DECIMAL(10,2),

    CONSTRAINT "reserva_extras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alquileres" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "reserva_id" UUID,
    "km_salida" INTEGER,
    "km_entrada" INTEGER,
    "fecha_inicio" TIMESTAMP(6),
    "fecha_fin" TIMESTAMP(6),
    "cargo_adicional" DECIMAL(10,2) DEFAULT 0,
    "status" "alquiler_status" DEFAULT 'ACTIVO',
    "observaciones" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alquileres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devoluciones" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "alquiler_id" UUID,
    "fecha_devolucion" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "km_entrada" INTEGER,
    "estado_vehiculo" TEXT,
    "cargo_extra" DECIMAL(10,2) DEFAULT 0,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devoluciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "correlation_id" UUID,
    "usuario_id" UUID,
    "evento" TEXT,
    "payload" JSONB,
    "status" "outbox_status" DEFAULT 'PENDIENTE',
    "intentos" INTEGER DEFAULT 0,
    "procesado_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seguros_nombre_key" ON "seguros"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "canales_venta_nombre_key" ON "canales_venta"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "canales_venta_codigo_key" ON "canales_venta"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "reservas_correlation_id_key" ON "reservas"("correlation_id");

-- CreateIndex
CREATE UNIQUE INDEX "reservas_codigo_reserva_key" ON "reservas"("codigo_reserva");

-- CreateIndex
CREATE UNIQUE INDEX "reserva_extras_reserva_id_extra_id_key" ON "reserva_extras"("reserva_id", "extra_id");

-- CreateIndex
CREATE UNIQUE INDEX "alquileres_reserva_id_key" ON "alquileres"("reserva_id");

-- CreateIndex
CREATE UNIQUE INDEX "devoluciones_alquiler_id_key" ON "devoluciones"("alquiler_id");

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_canal_venta_id_fkey" FOREIGN KEY ("canal_venta_id") REFERENCES "canales_venta"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_seguro_id_fkey" FOREIGN KEY ("seguro_id") REFERENCES "seguros"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reserva_extras" ADD CONSTRAINT "reserva_extras_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alquileres" ADD CONSTRAINT "alquileres_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_alquiler_id_fkey" FOREIGN KEY ("alquiler_id") REFERENCES "alquileres"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

