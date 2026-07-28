ALTER TABLE `road_segments`
  ADD COLUMN `hasSeating` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `communityObservationCount` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `dataConfidence` DOUBLE NULL,
  ADD COLUMN `lastCommunityUpdateAt` DATETIME(3) NULL,
  ADD COLUMN `baselineData` JSON NULL;

ALTER TABLE `reports`
  ADD COLUMN `observationData` JSON NULL;
