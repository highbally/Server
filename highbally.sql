-- CREATE DATABASE highbally;
-- CREATE USER 'juseung'@'localhost' IDENTIFIED BY '0000';
-- GRANT ALL PRIVILEGES ON highbally.* TO 'juseung'@'localhost';
-- use highbally;
-- CREATE TABLE user_auth_info (
--   user_id VARCHAR(255) NOT NULL PRIMARY KEY,
--   password VARCHAR(255) NOT NULL
-- );
-- CREATE TABLE user_profile (
--   user_id VARCHAR(255) NOT NULL PRIMARY KEY,
--   nickname VARCHAR(10) NOT NULL,
--   email VARCHAR(255),
--   phone_number VARCHAR(11),
--   gender VARCHAR(2),
--   birth VARCHAR(10)
-- );
-- ALTER TABLE user_profile DROP COLUMN email;
-- ALTER TABLE user_auth_info ADD phone_number VARCHAR(11);

alter database highbally default character set UTF8MB4 collate utf8mb4_general_ci;
CREATE TABLE user_profile (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usr_id VARCHAR(32) NOT NULL,
  usr_pwd VARCHAR(64) NOT NULL,
  name VARCHAR(10) NOT NULL,
  nickname VARCHAR(10) NOT NULL,
  phonenumber VARCHAR(11) NOT NULL,
  gender VARCHAR(2) NOT NULL,
  birth VARCHAR(8) NOT NULL
) default character set UTF8MB4 collate utf8mb4_general_ci;


/*
mysql.server start // 서버 켜기

mysql.server stop // 서버 끄기
*/