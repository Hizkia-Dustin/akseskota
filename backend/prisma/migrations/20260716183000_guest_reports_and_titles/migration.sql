ALTER TABLE `reports`
  MODIFY `userId` VARCHAR(191) NULL,
  ADD COLUMN `guestAccessKey` VARCHAR(191) NULL,
  ADD COLUMN `title` VARCHAR(191) NOT NULL DEFAULT 'Laporan hambatan';

CREATE UNIQUE INDEX `reports_guestAccessKey_key` ON `reports`(`guestAccessKey`);
