-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('USER', 'MODERATOR', 'ADMIN') NOT NULL DEFAULT 'USER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_preferences` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `mode` ENUM('WHEELCHAIR', 'ELDERLY', 'STROLLER', 'LOW_VISION', 'GENERAL') NOT NULL DEFAULT 'GENERAL',
    `shadeWeight` DOUBLE NOT NULL DEFAULT 0.3,
    `seatingWeight` DOUBLE NOT NULL DEFAULT 0.2,
    `lightingWeight` DOUBLE NOT NULL DEFAULT 0.2,
    `distanceWeight` DOUBLE NOT NULL DEFAULT 0.3,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_preferences_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `road_segments` (
    `id` VARCHAR(191) NOT NULL,
    `geometry` linestring NULL,
    `surfaceCondition` VARCHAR(191) NULL,
    `widthMeters` DOUBLE NULL,
    `hasRamp` BOOLEAN NOT NULL DEFAULT false,
    `hasStairs` BOOLEAN NOT NULL DEFAULT false,
    `hasGuidingBlock` BOOLEAN NOT NULL DEFAULT false,
    `shadeLevel` DOUBLE NULL,
    `lightingAvailable` BOOLEAN NOT NULL DEFAULT false,
    `accessibilityScore` DOUBLE NULL,
    `comfortScore` DOUBLE NULL,
    `source` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shade_observations` (
    `id` VARCHAR(191) NOT NULL,
    `roadSegmentId` VARCHAR(191) NOT NULL,
    `observedAt` DATETIME(3) NOT NULL,
    `weather` VARCHAR(191) NULL,
    `shadePercent` DOUBLE NOT NULL,
    `photoUrl` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `facilities` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('RAMP', 'LIFT', 'BENCH', 'SHELTER', 'DRINKING_WATER', 'ACCESSIBLE_TOILET') NOT NULL,
    `geometry` point NULL,
    `name` VARCHAR(191) NULL,
    `condition` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `obstacles` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('STAIRS', 'POTHOLE', 'FLOOD', 'PARKED_VEHICLE', 'CONSTRUCTION', 'FALLEN_TREE') NOT NULL,
    `geometry` point NULL,
    `status` ENUM('TEMPORARY', 'PERMANENT') NOT NULL DEFAULT 'TEMPORARY',
    `description` TEXT NULL,
    `expiresAt` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reports` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `targetType` ENUM('ROAD_SEGMENT', 'OBSTACLE', 'FACILITY') NOT NULL,
    `roadSegmentId` VARCHAR(191) NULL,
    `obstacleId` VARCHAR(191) NULL,
    `facilityId` VARCHAR(191) NULL,
    `photoUrl` TEXT NOT NULL,
    `description` TEXT NULL,
    `verificationStatus` ENUM('UNVERIFIED', 'VERIFIED', 'REJECTED', 'NEEDS_RECHECK') NOT NULL DEFAULT 'UNVERIFIED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verifications` (
    `id` VARCHAR(191) NOT NULL,
    `reportId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `action` ENUM('UNVERIFIED', 'VERIFIED', 'REJECTED', 'NEEDS_RECHECK') NOT NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `route_history` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `originLat` DOUBLE NOT NULL,
    `originLng` DOUBLE NOT NULL,
    `destLat` DOUBLE NOT NULL,
    `destLng` DOUBLE NOT NULL,
    `mode` ENUM('WHEELCHAIR', 'ELDERLY', 'STROLLER', 'LOW_VISION', 'GENERAL') NOT NULL,
    `chosenRouteJson` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `meta` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_preferences` ADD CONSTRAINT `user_preferences_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shade_observations` ADD CONSTRAINT `shade_observations_roadSegmentId_fkey` FOREIGN KEY (`roadSegmentId`) REFERENCES `road_segments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_roadSegmentId_fkey` FOREIGN KEY (`roadSegmentId`) REFERENCES `road_segments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_obstacleId_fkey` FOREIGN KEY (`obstacleId`) REFERENCES `obstacles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_facilityId_fkey` FOREIGN KEY (`facilityId`) REFERENCES `facilities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `verifications` ADD CONSTRAINT `verifications_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `reports`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `verifications` ADD CONSTRAINT `verifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `route_history` ADD CONSTRAINT `route_history_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
