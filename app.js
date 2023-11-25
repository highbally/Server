import createError from "http-errors";
import express from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import logger from "morgan";
import session from "express-session";
import bodyParser from "body-parser";
import nunjucks from "nunjucks";
import dotenv from "dotenv";
import fs from "fs";
import cors from 'cors';


dotenv.config();

const app = express();
app.use(express.static('public'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CORS 설정: 모든 도메인에서의 요청 허용
app.use(cors());

// html을 뷰 엔진으로 설정 -> 동적인 웹 페이지 생성 가능, 템플릿 엔진 사용 가능
app.set("view engine", "ejs");
// app.set("view engine", "html");

// app.use(): 모든 종류의 요청에 대해 실행할 미들웨어 등록, 등록된 순서대로 실행, app.use 실행 후 app.get 등 실행
app.use(logger("dev")); // 콘솔에 로그 출력
app.use(express.json()); // 요청이 JSON 형식일 경우 요청 본문을 파싱해 JavaScript 객체로 변환하고 req.body에 저장 -> app.post()에서 req.body를 통해 클라이언트가 전송한 데이터에 접근 가능
app.use(express.urlencoded({ extended: false })); //요청이 urlencoded 데이터일 경우 파싱해 req.body에 저장

// for postman
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

app.use(cookieParser()); // 요청 헤더에 포함된 쿠키를 해석한 뒤 해당 쿠키 정보를 req.cookies에 저장
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secret: process.env.SECRET,
      httpOnly: true,
    },
  })
);

// 정적 파일 제공을 위한 미들웨어 등록(정적 파일 위치=__dirname+'public')
// 정적 파일은 서버에서 동적으로 처리되지 않고 클라이언트 측에서 다운로드해 사용하는 파일
app.use(express.static(path.join(__dirname, "public")));

// 라우터 자동 추가(routes 디렉토리에 있는 모든 파일을 라우터로 추가)
// 라우터를 사용하면 작업별로 분할해서 처리할 수 있음
const routeFiles = fs
  .readdirSync(path.join(__dirname, "/routes"))
  .filter((file) => file.indexOf(".") !== 0 && file.slice(-3) === ".js");

for await (const routeFile of routeFiles) {
  const router = await import(`./routes/${routeFile}`);
  app.use(`/${routeFile.split(".")[0].replace("index", "")}`, router.default);
}

// 404 오류 생성
app.use(function (req, res, next) {
  next(createError(404));
});

// 에러 핸들러: 에러가 발생했을 때만 호출
app.use(function (err, req, res, next) {
  // 로컬 변수 res.locals 설정(res.locals에 현재 요청과 관련된 정보를 저장 및 활용, 주로 템플릿 엔진에서 뷰를 렌더링할 때 데이터를 전달하는 용도로 사용)
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {}; // 환경 모드가 development일 경우, err 객체를 할당하고 그렇지 않으면 할당 안 함

  // 에러 페이지 렌더링
  res.status(err.status || 500); // 클라이언트에게 상태 코드 전달
  // res.render("error"); // error 템플릿 렌더링(위에서 지정한 views 디렉토리에 있음), err 객체를 템플릿으로 전달
    res.render('error', {err});
});


// app 객체 다른 파일에서 사용가능(import app from './app.js';)
export default app;
