CREATE TABLE `community_places` (
  `id` VARCHAR(191) NOT NULL,
  `externalId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `address` VARCHAR(191) NULL,
  `latitude` DOUBLE NOT NULL,
  `longitude` DOUBLE NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `community_places_externalId_key` (`externalId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `place_posts` (
  `id` VARCHAR(191) NOT NULL,
  `placeId` VARCHAR(191) NOT NULL,
  `authorId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `content` TEXT NOT NULL,
  `rating` INTEGER NOT NULL,
  `accessibilityRating` INTEGER NOT NULL,
  `photoUrl` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `place_posts_placeId_createdAt_idx` (`placeId`, `createdAt`),
  CONSTRAINT `place_posts_placeId_fkey` FOREIGN KEY (`placeId`) REFERENCES `community_places`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `place_posts_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
