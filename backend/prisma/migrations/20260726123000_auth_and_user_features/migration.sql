-- Tables introduced by the beTambahan authentication and user feature merge.

CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `navigation_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `originLat` DOUBLE NOT NULL,
    `originLng` DOUBLE NOT NULL,
    `destLat` DOUBLE NOT NULL,
    `destLng` DOUBLE NOT NULL,
    `mode` ENUM('WHEELCHAIR', 'ELDERLY', 'STROLLER', 'LOW_VISION', 'GENERAL') NOT NULL DEFAULT 'GENERAL',
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finishedAt` DATETIME(3) NULL,
    `distanceMeters` DOUBLE NULL,
    `durationSeconds` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `favorite_routes` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `originLat` DOUBLE NOT NULL,
    `originLng` DOUBLE NOT NULL,
    `destLat` DOUBLE NOT NULL,
    `destLng` DOUBLE NOT NULL,
    `mode` ENUM('WHEELCHAIR', 'ELDERLY', 'STROLLER', 'LOW_VISION', 'GENERAL') NOT NULL DEFAULT 'GENERAL',
    `routeJson` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `search_history` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `originLat` DOUBLE NOT NULL,
    `originLng` DOUBLE NOT NULL,
    `destLat` DOUBLE NOT NULL,
    `destLng` DOUBLE NOT NULL,
    `mode` ENUM('WHEELCHAIR', 'ELDERLY', 'STROLLER', 'LOW_VISION', 'GENERAL') NOT NULL DEFAULT 'GENERAL',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `notifications`
    ADD CONSTRAINT `notifications_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `navigation_sessions`
    ADD CONSTRAINT `navigation_sessions_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `favorite_routes`
    ADD CONSTRAINT `favorite_routes_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `search_history`
    ADD CONSTRAINT `search_history_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
