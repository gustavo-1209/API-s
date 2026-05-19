-- CreateEnum
CREATE TYPE "vehicle_status" AS ENUM ('DISPONIBLE', 'RESERVADO', 'EN_USO', 'MANTENIMIENTO', 'INACTIVO');

-- CreateTable
CREATE TABLE "marcas" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nombre" TEXT,
    "logo_url" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marcas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modelos" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "marca_id" UUID,
    "nombre" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "modelos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nombre" TEXT,
    "descripcion" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_combustible" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nombre" TEXT,

    CONSTRAINT "tipos_combustible_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_transmision" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nombre" TEXT,

    CONSTRAINT "tipos_transmision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extras_equipamiento" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nombre" TEXT,
    "descripcion" TEXT,
    "precio_dia" DECIMAL(10,2),
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extras_equipamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehiculos" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "agencia_id" UUID,
    "modelo_id" UUID,
    "categoria_id" UUID,
    "tipo_combustible_id" UUID,
    "tipo_transmision_id" UUID,
    "placa" TEXT,
    "color" TEXT,
    "anio" INTEGER,
    "kilometraje" INTEGER DEFAULT 0,
    "numero_pasajeros" INTEGER DEFAULT 5,
    "precio_dia" DECIMAL(10,2),
    "imagen_url" TEXT,
    "descripcion" TEXT,
    "status" "vehicle_status" DEFAULT 'DISPONIBLE',
    "is_active" BOOLEAN DEFAULT true,
    "deleted_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehiculos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marcas_nombre_key" ON "marcas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "modelos_marca_id_nombre_key" ON "modelos"("marca_id", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_combustible_nombre_key" ON "tipos_combustible"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_transmision_nombre_key" ON "tipos_transmision"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "extras_equipamiento_nombre_key" ON "extras_equipamiento"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "vehiculos_placa_key" ON "vehiculos"("placa");

-- AddForeignKey
ALTER TABLE "modelos" ADD CONSTRAINT "modelos_marca_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "marcas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vehiculos" ADD CONSTRAINT "vehiculos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vehiculos" ADD CONSTRAINT "vehiculos_modelo_id_fkey" FOREIGN KEY ("modelo_id") REFERENCES "modelos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vehiculos" ADD CONSTRAINT "vehiculos_tipo_combustible_id_fkey" FOREIGN KEY ("tipo_combustible_id") REFERENCES "tipos_combustible"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vehiculos" ADD CONSTRAINT "vehiculos_tipo_transmision_id_fkey" FOREIGN KEY ("tipo_transmision_id") REFERENCES "tipos_transmision"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

