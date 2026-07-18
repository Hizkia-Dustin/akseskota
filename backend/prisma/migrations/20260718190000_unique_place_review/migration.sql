-- Keep the newest contribution when the same author reviewed a place more than once.
DELETE older
FROM place_posts older
JOIN place_posts newer
  ON older.placeId = newer.placeId
 AND older.authorId = newer.authorId
 AND (older.createdAt < newer.createdAt OR (older.createdAt = newer.createdAt AND older.id < newer.id));

CREATE UNIQUE INDEX `place_posts_placeId_authorId_key` ON `place_posts`(`placeId`, `authorId`);
