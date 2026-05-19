-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'CLIENTE');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nombres" TEXT,
    "apellidos" TEXT,
    "cedula" TEXT,
    "telefono" TEXT,
    "ciudad_id" UUID,
    "role" "user_role" DEFAULT 'CLIENTE',
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "usuario_id" UUID,
    "numero_licencia" TEXT,
    "fecha_venc_licencia" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_usuarios" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "usuario_id" UUID,
    "accion" TEXT,
    "entidad" TEXT,
    "entidad_id" TEXT,
    "detalle" JSONB,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_cedula_key" ON "usuarios"("cedula");

-- CreateIndex
CREATE INDEX "idx_usuarios_email" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_usuario_id_key" ON "clientes"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_numero_licencia_key" ON "clientes"("numero_licencia");

-- CreateIndex
CREATE INDEX "idx_historial_usuario" ON "historial_usuarios"("usuario_id");

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "historial_usuarios" ADD CONSTRAINT "historial_usuarios_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

