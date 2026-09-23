-- BeanCraft schema (MySQL 8.x).
-- Import in phpMyAdmin: open your database, then Import -> choose this file -> Go.

CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  api_token     CHAR(64) NULL UNIQUE,          -- sha256 of the token, never the token itself
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE beans (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id        INT UNSIGNED NOT NULL,
  name           VARCHAR(100) NOT NULL,
  roaster        VARCHAR(100) NOT NULL,
  origin         VARCHAR(100) NULL,
  farm           VARCHAR(100) NULL,
  process_method VARCHAR(50)  NULL,
  roast_level    VARCHAR(50)  NULL,
  roast_date     DATE         NULL,
  altitude       VARCHAR(50)  NULL,
  tasting_notes  VARCHAR(255) NULL,            -- comma-separated, e.g. "Jasmine, Peach"
  bag_weight_g   INT UNSIGNED NOT NULL,
  remaining_g    INT UNSIGNED NOT NULL,
  price          DECIMAL(8,2) NULL,            -- pesos
  rating         DECIMAL(2,1) NULL,            -- star score, 0.0-5.0
  cupping_notes  TEXT NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_beans_user (user_id, created_at),
  CONSTRAINT fk_beans_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT chk_bag_weight CHECK (bag_weight_g > 0),
  CONSTRAINT chk_remaining  CHECK (remaining_g <= bag_weight_g),
  CONSTRAINT chk_rating     CHECK (rating BETWEEN 0 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
