-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'INSTRUCTOR', 'ADMIN', 'DIRECTION');

-- CreateTable
CREATE TABLE "campuses" (
    "campus_id" TEXT NOT NULL,
    "campus_name" VARCHAR(180) NOT NULL,
    "address" VARCHAR(255),
    "city" VARCHAR(100),
    "postal_code" VARCHAR(50),
    "region" VARCHAR(180),
    "campus_director" VARCHAR(180),
    "phone" VARCHAR(50),
    "email" VARCHAR(250),
    "capacity_students" INTEGER,
    "opening_date" DATE,
    "status" VARCHAR(50) NOT NULL,

    CONSTRAINT "campuses_pkey" PRIMARY KEY ("campus_id")
);

-- CreateTable
CREATE TABLE "programs" (
    "program_id" TEXT NOT NULL,
    "campus_id" VARCHAR(50) NOT NULL,
    "program_name" VARCHAR(180) NOT NULL,
    "program_type" VARCHAR(100),
    "duration_years" DECIMAL(18,0) NOT NULL,
    "annual_tuition" DECIMAL(12,2),
    "department" VARCHAR(180),
    "coordinator" VARCHAR(180),
    "max_students" INTEGER,
    "status" VARCHAR(100) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("program_id")
);

-- CreateTable
CREATE TABLE "instructors" (
    "instructor_id" TEXT NOT NULL,
    "campus_id" VARCHAR(50) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(180),
    "phone" VARCHAR(50),
    "department" VARCHAR(180),
    "specialization" VARCHAR(180),
    "hire_date" DATE,
    "status" VARCHAR(50),

    CONSTRAINT "instructors_pkey" PRIMARY KEY ("instructor_id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "room_id" TEXT NOT NULL,
    "campus_id" VARCHAR(50) NOT NULL,
    "room_name" VARCHAR(180) NOT NULL,
    "building" VARCHAR(180),
    "floor" INTEGER,
    "capacity" INTEGER,
    "room_type" VARCHAR(50),
    "equipment" VARCHAR(255),
    "status" VARCHAR(50) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("room_id")
);

-- CreateTable
CREATE TABLE "students" (
    "student_id" TEXT NOT NULL,
    "campus_id" VARCHAR(50) NOT NULL,
    "program_id" VARCHAR(50) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "status" VARCHAR(50),
    "birth_date" DATE,
    "enrollment_year" INTEGER NOT NULL,
    "payment_status" VARCHAR(100) NOT NULL,
    "address" VARCHAR(255),
    "city" VARCHAR(180),
    "postal_code" VARCHAR(180),
    "emergency_contact" VARCHAR(180),
    "emergency_phone" VARCHAR(50),

    CONSTRAINT "students_pkey" PRIMARY KEY ("student_id")
);

-- CreateTable
CREATE TABLE "courses" (
    "course_id" TEXT NOT NULL,
    "program_id" VARCHAR(50) NOT NULL,
    "instructor_id" VARCHAR(50) NOT NULL,
    "room_id" VARCHAR(50),
    "course_name" VARCHAR(180) NOT NULL,
    "course_code" VARCHAR(50) NOT NULL,
    "semester" INTEGER NOT NULL,
    "credits" INTEGER NOT NULL,
    "hours_total" INTEGER,
    "status" VARCHAR(100) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("course_id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "schedule_id" TEXT NOT NULL,
    "course_id" VARCHAR(50) NOT NULL,
    "instructor_id" VARCHAR(50) NOT NULL,
    "room_id" VARCHAR(50) NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "semester" INTEGER,
    "academic_year" VARCHAR(50),
    "status" VARCHAR(50),
    "last_modified" TIMESTAMP(3),

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("schedule_id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "enrollment_id" TEXT NOT NULL,
    "student_id" VARCHAR(50) NOT NULL,
    "course_id" VARCHAR(50) NOT NULL,
    "semester" INTEGER,
    "academic_year" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50),
    "final_grade" DECIMAL(4,2),
    "attendance_rate" DECIMAL(4,2),
    "enrollment_date" DATE NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("enrollment_id")
);

-- CreateTable
CREATE TABLE "payments" (
    "payment_id" TEXT NOT NULL,
    "student_id" VARCHAR(50) NOT NULL,
    "invoice_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "payment_date" DATE,
    "payment_method" VARCHAR(50),
    "academic_year" VARCHAR(50) NOT NULL,
    "semester" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "relance_history" (
    "id" TEXT NOT NULL,
    "payment_id" VARCHAR(50) NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" INTEGER NOT NULL,
    "channel" VARCHAR(50) NOT NULL,
    "draft_content" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "escalated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "relance_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "notification_id" TEXT NOT NULL,
    "user_id" VARCHAR(50) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "message" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL,
    "campus_id" VARCHAR(50),
    "student_id" VARCHAR(50),
    "email" VARCHAR(180) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "kpi_dashboard" (
    "id" TEXT NOT NULL,
    "period" VARCHAR(50) NOT NULL,
    "campus_id" VARCHAR(50) NOT NULL,
    "total_students" INTEGER,
    "enrollment_rate_percent" DECIMAL(4,2),
    "average_attendance_percent" DECIMAL(4,2),
    "success_rate_percent" DECIMAL(4,2),
    "revenue" DECIMAL(12,2),
    "payment_default_rate_percent" DECIMAL(4,2),
    "room_occupancy_percent" DECIMAL(5,2),
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kpi_dashboard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_student_id_course_id_academic_year_key" ON "enrollments"("student_id", "course_id", "academic_year");

-- CreateIndex
CREATE UNIQUE INDEX "users_student_id_key" ON "users"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_dashboard_campus_id_period_key" ON "kpi_dashboard"("campus_id", "period");

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "campuses"("campus_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructors" ADD CONSTRAINT "instructors_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "campuses"("campus_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "campuses"("campus_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "campuses"("campus_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("program_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("program_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructors"("instructor_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("room_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("course_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructors"("instructor_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("room_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("course_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relance_history" ADD CONSTRAINT "relance_history_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("payment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "campuses"("campus_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_dashboard" ADD CONSTRAINT "kpi_dashboard_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "campuses"("campus_id") ON DELETE RESTRICT ON UPDATE CASCADE;
