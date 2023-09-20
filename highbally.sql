DROP DATABASE IF EXISTS highbally;

//디비 생성 & 테이블 생성
CREATE DATABASE highbally DEFAULT CHARACTER SET UTF8MB4 COLLATE utf8mb4_general_ci;
use highbally;
CREATE TABLE user_profile (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usr_id VARCHAR(32) NOT NULL UNIQUE,
  usr_pwd VARCHAR(64) NOT NULL,
  name VARCHAR(10) NOT NULL,
  nickname VARCHAR(10) NOT NULL,
  phonenumber VARCHAR(11) NOT NULL,
  gender VARCHAR(2) NOT NULL,
  birth DATE NOT NULL,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  expired DATETIME,
  refresh_token VARCHAR(255)
) DEFAULT CHARACTER SET UTF8MB4 COLLATE utf8mb4_general_ci;


CREATE TABLE restaurant_info (
  restaurant_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  picture VARCHAR(255),
  number VARCHAR(20)
) DEFAULT CHARACTER SET UTF8MB4 COLLATE utf8mb4_general_ci;

CREATE TABLE open (
  open_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT NOT NULL,
  mon VARCHAR(15),
  tue VARCHAR(15),
  wed VARCHAR(15),
  thu VARCHAR(15),
  fri VARCHAR(15),
  sat VARCHAR(15),
  sun VARCHAR(15),
  available VARCHAR(10),
  FOREIGN KEY (restaurant_id) REFERENCES restaurant_info(restaurant_id)
) DEFAULT CHARACTER SET UTF8MB4 COLLATE utf8mb4_general_ci;

CREATE TABLE menu_info (
  menu_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT NOT NULL,
  name VARCHAR(20) NOT NULL,
  price INT NOT NULL,
  picture VARCHAR(255),
  description VARCHAR(255),
  FOREIGN KEY (restaurant_id) REFERENCES restaurant_info(restaurant_id)
) DEFAULT CHARACTER SET UTF8MB4 COLLATE utf8mb4_general_ci;

CREATE TABLE highball_info (
  highball_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT NOT NULL,
  name VARCHAR(20) NOT NULL,
  price INT NOT NULL,
  picture VARCHAR(255),
  description VARCHAR(255),
  available BOOLEAN NOT NULL DEFAULT false,
  FOREIGN KEY (restaurant_id) REFERENCES restaurant_info(restaurant_id)
) DEFAULT CHARACTER SET UTF8MB4 COLLATE utf8mb4_general_ci;

CREATE TABLE menu_list (
  menulist_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT NOT NULL,
  menulist VARCHAR(255) NOT NULL,
  FOREIGN KEY (restaurant_id) REFERENCES restaurant_info(restaurant_id)
) DEFAULT CHARACTER SET UTF8MB4 COLLATE utf8mb4_general_ci;

CREATE TABLE review (
  review_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT NOT NULL,
  writer VARCHAR(10) NOT NULL,
  rate DECIMAL(2,1) NOT NULL,
  content TEXT NOT N9ULL,
  FOREIGN KEY (restaurant_id) REFERENCES restaurant_info(restaurant_id)
) DEFAULT CHARACTER SET UTF8MB4 COLLATE utf8mb4_general_ci;


CREATE TABLE usage_history (
  usage_id INT AUTO_INCREMENT PRIMARY KEY,
  id INT NOT NULL,
  restaurant_id INT NOT NULL,
  highball_id INT NOT NULL,
  time DATETIME NOT NULL,
  -- FOREIGN KEY (id) REFERENCES user_profile(id),
  -- FOREIGN KEY (restaurant_id) REFERENCES restaurant_info(restaurant_id),
  -- FOREIGN KEY (highball_id) REFERENCES highball_info(highball_id)
) DEFAULT CHARACTER SET UTF8MB4 COLLATE utf8mb4_general_ci;

CREATE TABLE markers (
  markers_id INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT NOT NULL,
  latitude DECIMAL(23,20) NOT NULL,
  longitude DECIMAL(23,20) NOT NULL,
  address VARCHAR(255) NOT NULL,
  FOREIGN KEY (restaurant_id) REFERENCES restaurant_info(restaurant_id)
) DEFAULT CHARACTER SET UTF8MB4 COLLATE utf8mb4_general_ci;

//TEST용 예시
INSERT INTO restaurant_info (name, picture, number)
VALUES 
  ('미라쥬펍', 'image_a.jpg', '02-6012-9433'),
  ('여기,꼬치네', 'image_b.jpg', '0507-1321-5957'),
  ('섬사나이', 'image_c.jpg', '0507-1335-2481');

INSERT INTO open (restaurant_id, mon, tue, wed, thu, fri, sat, sun, available)
VALUES 
  (1, '17:00 - 02:00', '17:00 - 02:00', '17:00 - 02:00','17:00 - 02:00', '17:00 - 02:00', '17:00 - 02:00', '휴무', '월화수목금토'),
  (2, '17:00 - 03:00', '17:00 - 03:00', '17:00 - 03:00','17:00 - 03:00', '17:00 - 03:00', '17:00 - 03:00', '17:00 - 03:00', '월화수목금토일'),
  (3, '17:00 - 01:00', '17:00 - 01:00', '17:00 - 01:00','17:00 - 01:00', '17:00 - 01:00', '17:00 - 01:00', '휴무', '월화수목금토');

INSERT INTO markers (restaurant_id, latitude, longitude, address)
VALUES
  (1, 37.6251189, 127.0772512, "서울 노원구 동일로184길 69-9 2층"), --미라쥬펍
  (2, 37.6267907, 127.0763521, "서울 노원구 동일로192길 62 2층"), --여기 꼬치네
  (3, 37.6235396, 127.0782706, "서울 노원구 공릉로39길 21 섬사나이"); --섬사나이

INSERT INTO highball_info (restaurant_id, name, price, picture, description)
VALUES
  (1, "스모키 얼그레이 하이볼", 8000, "highball1.jpg", "칼리일위스키. 묵직한 훈연의 홍차향."),
  (1, "미녀 석류 하이볼", 8000, "highball2.jpg", "존바위스키. 석류의 새콤달콤함."),
  (1, "캐모마일리치 하이볼", 8000, "highball3.jpg", "칼라일위스키. 리치의 달콤하고 햐긋함."),
  (1, "시나몬스틱하이볼", 8000, "highball4.jpg", "풍부한 시나몬 향."),
  (5, "위스키 하이볼", 6500, "highball4.jpg", "480ML", true),
  (5, "연태 하이볼", 7000, "highball5.jpg","480ML", true),
  (5, "얼그레이 하이볼", 7000, "highball6.jpg","480ML", true);

-- INSERT INTO menu_info (restaurant_id, name, price, picture, description)
-- VALUES
-- (4, "미라쥬 플레이트", 20000, "menu1.jpg", "미리쥬키친에서 직접 구운 양과자와 치즈들로 플레이팅, 눈으로 즐겨도 반할만한 플레이트 메뉴"),
-- (4, "대창 순두부 낙곱새", 34000, "menu2.jpg", "입안에서 녹아내리는 순두부와 대창에 특제양념 소스로 얼큰하게 맛을 낸 미라쥬펍 만의 낙곱새"),
-- (4, "맥앤치즈 & 포테이토", 12000, "menu3.jpg", "부드럽고 고소한 맥앤치즈에 감자튀김을 더해 부드러움과 바삭함을 동시에 즐길 수 있는 메뉴"),
-- (5, "꼬치 구이 모둠 세트", 18000, "menu4.jpg", "여기, 꼬치네 만의 꼬치구이를 다양하게 즐기실 수 있습니다."),
-- (5, "야끼소바", 12000, "menu5.jpg", "일본식 볶음국수");

INSERT INTO menu_list (restaurant_id, menulist)
VALUES
(4, "menu_list1.jpg"),
(4, "menu_list2.jpg"),
(5, "menu_list3.jpg"),
(5, "menu_list4.jpg"),
(5, "menu_list5.jpg");

ALTER TABLE restaurant_info ADD code VARCHAR(20);
UPDATE restaurant_info SET code = '1234' WHERE restaurant_id = 4;
UPDATE restaurant_info SET code = '5678' WHERE restaurant_id = 5;

DROP TABLE usage_history;

CREATE TABLE usage_history (
  usage_id INT AUTO_INCREMENT PRIMARY KEY,
  usr_id VARCHAR(32) NOT NULL,
  restaurant_name VARCHAR(255) NOT NULL,
  highball_name VARCHAR(255) NOT NULL,
  time DATETIME NOT NULL
) DEFAULT CHARACTER SET UTF8MB4 COLLATE utf8mb4_general_ci;


ALTER TABLE user_profile ADD COLUMN availability BOOLEAN NOT NULL DEFAULT true;



use highbally;
ALTER TABLE user_profile ADD picture VARCHAR(255);
UPDATE user_profile SET picture = 'juseungimage1.jpg' WHERE id = 1;


CREATE TABLE blacklist (
  token_id INT AUTO_INCREMENT PRIMARY KEY,
  access_token VARCHAR(255) NOT NULL
) DEFAULT CHARACTER SET UTF8MB4 COLLATE utf8mb4_general_ci;


ALTER TABLE blacklist ADD created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

