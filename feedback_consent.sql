-- Run once (phpMyAdmin or mysql) on the database used by submit.php
ALTER TABLE feedback
  ADD COLUMN consent_proc TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN consent_pub TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN consent_version VARCHAR(20) NOT NULL DEFAULT '',
  ADD COLUMN consent_at DATETIME NULL;
