-- AlterEnum
ALTER TYPE "LeaveStatus" ADD VALUE 'CANCELED';

-- AlterTable
ALTER TABLE "Leave" ADD COLUMN "cancelReason" TEXT; 