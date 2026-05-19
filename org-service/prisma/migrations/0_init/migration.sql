-- CreateTable
CREATE TABLE "provincias" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provincias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ciudades" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nombre" TEXT NOT NULL,
    "provincia_id" UUID,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ciudades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresas" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "nombre" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "logo_url" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agencias" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "empresa_id" UUID,
    "ciudad_id" UUID,
    "nombre" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agencias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "provincias_nombre_key" ON "provincias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "provincias_codigo_key" ON "provincias"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ciudades_nombre_provincia_id_key" ON "ciudades"("nombre", "provincia_id");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_nombre_key" ON "empresas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_ruc_key" ON "empresas"("ruc");

-- AddForeignKey
ALTER TABLE "ciudades" ADD CONSTRAINT "ciudades_provincia_id_fkey" FOREIGN KEY ("provincia_id") REFERENCES "provincias"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "agencias" ADD CONSTRAINT "agencias_ciudad_id_fkey" FOREIGN KEY ("ciudad_id") REFERENCES "ciudades"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "agencias" ADD CONSTRAINT "agencias_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

