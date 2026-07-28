CREATE TABLE `directory_contributions` (
  `id` VARCHAR(191) NOT NULL,
  `kind` VARCHAR(191) NOT NULL,
  `placeId` VARCHAR(191) NULL,
  `authorId` VARCHAR(191) NOT NULL,
  `featureCode` VARCHAR(191) NULL,
  `proposedAvailable` BOOLEAN NULL,
  `proposedName` VARCHAR(191) NULL,
  `proposedCategory` VARCHAR(191) NULL,
  `proposedAddress` VARCHAR(500) NULL,
  `latitude` DOUBLE NULL,
  `longitude` DOUBLE NULL,
  `note` TEXT NOT NULL,
  `photoUrl` TEXT NOT NULL,
  `status` ENUM('UNVERIFIED', 'VERIFIED', 'REJECTED', 'NEEDS_RECHECK') NOT NULL DEFAULT 'UNVERIFIED',
  `resolvedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `directory_contributions_placeId_status_createdAt_idx`(`placeId`, `status`, `createdAt`),
  INDEX `directory_contributions_kind_status_createdAt_idx`(`kind`, `status`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `directory_contribution_votes` (
  `id` VARCHAR(191) NOT NULL,
  `contributionId` VARCHAR(191) NOT NULL,
  `voterId` VARCHAR(191) NOT NULL,
  `decision` ENUM('UNVERIFIED', 'VERIFIED', 'REJECTED', 'NEEDS_RECHECK') NOT NULL,
  `note` VARCHAR(500) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `directory_contribution_votes_contributionId_decision_idx`(`contributionId`, `decision`),
  UNIQUE INDEX `directory_contribution_votes_contributionId_voterId_key`(`contributionId`, `voterId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `directory_contributions`
  ADD CONSTRAINT `directory_contributions_placeId_fkey`
  FOREIGN KEY (`placeId`) REFERENCES `community_places`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `directory_contributions`
  ADD CONSTRAINT `directory_contributions_authorId_fkey`
  FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `directory_contribution_votes`
  ADD CONSTRAINT `directory_contribution_votes_contributionId_fkey`
  FOREIGN KEY (`contributionId`) REFERENCES `directory_contributions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `directory_contribution_votes`
  ADD CONSTRAINT `directory_contribution_votes_voterId_fkey`
  FOREIGN KEY (`voterId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
