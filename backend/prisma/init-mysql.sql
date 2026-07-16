-- MySQL 8.0.24+ has spatial data types (POINT/LINESTRING) and functions
-- (ST_Distance_Sphere, ST_GeomFromGeoJSON, ST_AsGeoJSON) built in — no
-- extension needed, unlike PostGIS on Postgres.
--
-- Run this AFTER `npx prisma migrate dev` has created the tables, since
-- Prisma's `Unsupported(...)` columns are created but spatial indexes need
-- to be added manually (Prisma does not manage SPATIAL INDEX).
--
-- Requirements for a SPATIAL INDEX in MySQL (already satisfied by the
-- Prisma schema): the geometry column must be NOT NULL and have a SRID
-- attribute — both are true for `geometry` on RoadSegment/Facility/Obstacle.

CREATE SPATIAL INDEX idx_road_segments_geometry ON road_segments (geometry);
CREATE SPATIAL INDEX idx_facilities_geometry ON facilities (geometry);
CREATE SPATIAL INDEX idx_obstacles_geometry ON obstacles (geometry);
