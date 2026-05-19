-- CreateTable
CREATE TABLE "sistemas_externos" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nombre" TEXT,
    "codigo" TEXT,
    "url" TEXT,
    "api_key" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sistemas_externos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mantenimientos" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "vehiculo_id" UUID,
    "tipo" TEXT,
    "descripcion" TEXT,
    "fecha_inicio" TIMESTAMP(6),
    "fecha_fin" TIMESTAMP(6),
    "costo" DECIMAL(10,2),
    "tecnico" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mantenimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kardex" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "vehiculo_id" UUID,
    "evento" TEXT,
    "estado_anterior" TEXT,
    "estado_nuevo" TEXT,
    "usuario_id" UUID,
    "referencia" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kardex_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sistemas_externos_nombre_key" ON "sistemas_externos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "sistemas_externos_codigo_key" ON "sistemas_externos"("codigo");

