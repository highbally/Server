CREATE DATABASE highbally;
CREATE USER 'juseung'@'localhost' IDENTIFIED BY '0000';
GRANT ALL PRIVILEGES ON highbally.* TO 'juseung'@'localhost';
use highbally;
CREATE TABLE user_auth_info (
  user_id VARCHAR(255) NOT NULL PRIMARY KEY,
  password VARCHAR(255) NOT NULL
);
CREATE TABLE user_profile (
  user_id VARCHAR(255) NOT NULL PRIMARY KEY,
  nickname VARCHAR(10) NOT NULL,
  email VARCHAR(255),
  phone_number VARCHAR(11),
  gender VARCHAR(2),
  birth VARCHAR(10)
);

/*
mysql.server start // 서버 켜기

mysql.server stop // 서버 끄기
*/