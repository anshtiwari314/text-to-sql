-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255),
    "email" VARCHAR(255) NOT NULL,
    "image" TEXT,
    "last_login" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_databases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" VARCHAR(100),
    "engine" VARCHAR(50),
    "host" VARCHAR(255),
    "port" INTEGER,
    "db_username" VARCHAR(100),
    "db_password" TEXT,
    "db_name" VARCHAR(100),

    CONSTRAINT "saved_databases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_histories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "database_id" UUID NOT NULL,
    "prompt" TEXT NOT NULL,
    "generated_sql" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "saved_databases" ADD CONSTRAINT "saved_databases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_histories" ADD CONSTRAINT "chat_histories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_histories" ADD CONSTRAINT "chat_histories_database_id_fkey" FOREIGN KEY ("database_id") REFERENCES "saved_databases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
