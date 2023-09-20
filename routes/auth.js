import express from "express";
import sqlCon from "../db/sqlCon.js";
import jwt from "jsonwebtoken";
import qs from "querystring";

const conn = sqlCon();
const router = express.Router();
const subRouter = express.Router();


import axios from "axios";
import Cache from "memory-cache";
import CryptoJS from "crypto-js";
import crypto from 'crypto';
import { token } from "morgan";

const date = Date.now().toString();
const uri = process.env.NCP_serviceID;
const secretKey = process.env.NCP_secretKey;
const accessKey = process.env.NCP_accessKey;
const method = "POST";
const space = " ";
const newLine = "\n";
const url = `https://sens.apigw.ntruss.com/sms/v2/services/${uri}/messages`;
const url2 = `/sms/v2/services/${uri}/messages`;

const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);

hmac.update(method);
hmac.update(space);
hmac.update(url2);
hmac.update(newLine);
hmac.update(date);
hmac.update(newLine);
hmac.update(accessKey);

const hash = hmac.finalize();
const signature = hash.toString(CryptoJS.enc.Base64);

//본인 인증 - 인증번호 전송
router.post("/signup/send", async (req, res) => {
  const phoneNumber = req.body.phoneNumber;

  Cache.del(phoneNumber);

  //인증번호 생성
  const verifyCode = Math.floor(Math.random() * (999999 - 100000)) + 100000;
  Cache.put(phoneNumber, verifyCode.toString());

  axios({
    method: method,
    json: true,
    url: url,
    headers: {
      "Content-Type": "application/json",
      "x-ncp-iam-access-key": accessKey,
      "x-ncp-apigw-timestamp": date,
      "x-ncp-apigw-signature-v2": signature,
    },
    data: {
      type: "SMS",
      contentType: "COMM",
      countryCode: "82",
      from: "01035115847",
      content: `[하이볼리] 인증번호 [${verifyCode}]를 입력해주세요.`,
      messages: [
        {
          to: `${phoneNumber}`,
        },
      ],
    },
  })
    .then(function (axiosRes) {
      res.send(`${phoneNumber}로 인증번호 전송에 성공했습니다.`);
    })
    .catch((err) => {
      if (err.res == undefined) {
        console.log(err);
        res.send(`${phoneNumber}로 인증번호 전송에 성공했습니다.`);
      } else {
        console.log(err);
        res.send(`${phoneNumber}로 인증번호 전송에 실패했습니다.`);
      }
    });
});

//본인 인증 - 인증번호 확인
router.post("/signup/verify", async (req, res) => {
  const phoneNumber = req.body.phoneNumber;
  const verifyCode = req.body.verifyCode;

  const CacheData = Cache.get(phoneNumber);

  if (!CacheData) {
    return res.send("인증번호를 입력해주세요.");
  } else if (CacheData !== verifyCode) {
    return res.send("인증번호가 일치하지 않습니다.");
  } else {
    Cache.del(phoneNumber);
    return res.send("인증에 성공했습니다.");
  }
});

// 본인 인증 - 암호화 토큰 발급 및 대칭키 생성
router.post("/signup/nice/issue_auth_token", async (req, res) => {

  // 세션에 리디렉션용 url 저장
  req.session.redirectUrl = req.body.redirectUrl;

  const url = "https://svc.niceapi.co.kr:22001/digital/niceid/api/v1.0/common/crypto/token"
  const credentials = `${process.env.ACCESS_TOKEN}:${Math.floor(Date.now() / 1000)}:${process.env.CLIENT_ID}`;
  const buffer = Buffer.from(credentials, 'utf-8');
  const encodedCredentials = buffer.toString('base64');
  const authorization = "bearer " + encodedCredentials;

  const headers = {
    "Content-Type": "application/json",
    Authorization: authorization,
    "client_id": process.env.CLIENT_ID,
    "ProductID": process.env.PRODUCT_ID,
  }

  // 시간 생성
  const time = new Date();
  const year = time.getFullYear();
  var month = time.getMonth() + 1;
  var date = time.getDate();
  var hour = time.getHours();
  var minute = time.getMinutes();
  var second = time.getSeconds();
  var req_dtim = year
  for (var i of [month, date, hour, minute, second]) {
    if (i < 10) i = "0" + i
    req_dtim += i
  }

  // 난수 생성
  const random = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let str = '';
    for (let i = 0; i < length; i++) {
      str += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return str;
  };
  const req_no = random(30)

  const requestData = {
    dataHeader: { "CNTY_CD": "ko" },
    dataBody: {
      req_dtim: req_dtim, // 요청일시 (YYYYMMDDHHMMSS)
      req_no: req_no, // 요청 고유번호
      enc_mode: '1',
    },
  };

  const data = await axios.post(url, requestData, { headers })
    .then((response) => {
      const responseData = response.data;

      const response_result_code = responseData.dataHeader.GW_RSLT_CD
      const result_message = responseData.dataHeader.GW_RSLT_MSG

      const response_code = responseData.dataBody.rsp_cd;
      const result_code = responseData.dataBody.result_cd;
      const site_code = responseData.dataBody.site_code;
      const token_version_id = responseData.dataBody.token_version_id;
      const token_val = responseData.dataBody.token_val;
      const period = responseData.dataBody.period;

      console.log('Response Result Code:', response_result_code);
      console.log('Response Result Message:', result_message);
      console.log('Response Code:', response_code);
      console.log('Result Code:', result_code);
      console.log('Site Code:', site_code);
      console.log('Token Version ID:', token_version_id);
      console.log('Token Value:', token_val);
      console.log('Period:', period);

      // 대칭키 및 무결성키 생성
      const value = req_dtim.trim() + req_no.trim() + token_val.trim();
      const hash = crypto.createHash('sha256');
      hash.update(value, 'utf-8');
      const arrHashValue = hash.digest();
      const resultVal = arrHashValue.toString('base64');
      const key = resultVal.slice(0, 16);
      const iv = resultVal.slice(-16);
      const hmac_key = resultVal.slice(0, 32);

      // 세션에 복호화에 필요한 데이터 저장
      req.session.key = key;
      req.session.iv = iv;

      // 데이터 암호화
      const reqData = JSON.stringify({
        "requestno": req_no,
        "returnurl": "https://www.highbally.com/auth/signup/nice/get_user_info",
        "sitecode": site_code,
        "methodtype": "post",
        "popupyn": "Y",
      });
      const cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(key), Buffer.from(iv));
      const encrypted = Buffer.concat([cipher.update(reqData, 'utf-8'), cipher.final()]);
      const enc_data = encrypted.toString('base64');

      // 무결성 체크값 생성
      function hmac256(secretKey, message) {
        try {
          const hmac = crypto.createHmac('sha256', secretKey);
          hmac.update(message);
          return hmac.digest();
        } catch (error) {
          throw new Error('Failed to generate HMACSHA256 encrypt');
        }
      }
      const hmacSha256 = hmac256(Buffer.from(hmac_key), Buffer.from(enc_data));
      const integrity_value = hmacSha256.toString('base64');

      const data = {
        "key": key,
        "iv": iv,
        "token_version_id": token_version_id,
        "enc_data": enc_data,
        "integrity_value": integrity_value,
      }
      return data
    })
    .catch((error) => {
      console.error("Error:", error.message);
    });

  res.header("Access-Control-Allow-Origin", "*");
  return res.status(200).json({
    status: 200,
    message: "본인인증용 대칭키 및 무결성 확인 완료",
    data: [{
      key: data.key,
      iv: data.iv,
      token_version_id: data.token_version_id,
      enc_data: data.enc_data,
      integrity_value: data.integrity_value,
    }],
  });
});

// 본인 인증 - 인증결과 확인
router.all('/signup/nice/get_user_info', (req, res) => {
  console.log("인증 결과 도착");

  //암호화된 인증 결과 데이터(PC 인 경우 method GET, mobile인 경우 method POST)
  const enc_data = req.body.httpBody,
        //위에서 redirect URL(클라이언트에서 전달한 값)
        redirectUrl = req.session.redirectUrl

  //redirect할 때 전달할 데이터
  let message = "";

  // Base64 인코딩에 유효한 문자 집합인지 확인
  if( /^0-9a-zA-Z+\/=/.test(enc_data) == true){
    console.log("입력값이 Base64 인코딩 형식이 아닙니다");
  }

  // Base64 디코딩하여 enc_data 가져오기
  const data_string = Buffer.from(enc_data, 'base64').toString('utf-8');
  const params = new URLSearchParams(data_string);
  const enc_data_ = params.get('enc_data');
  const data_buffer = Buffer.from(enc_data_, 'base64');
  
  // 세션에서 key, iv 가져오기
  const key = req.session.key;
  const iv = req.session.iv;
  
  // AES-128-CBC 복호화
  const decipher = crypto.createDecipheriv('aes-128-cbc', Buffer.from(key), Buffer.from(iv));
  const decrypted = Buffer.concat([decipher.update(data_buffer), decipher.final()]);

  // 복호화된 데이터를 문자열로 변환
  const dec_data = decrypted.toString('utf-8');

  // JSON 파싱
  try{
    const parsedData = JSON.parse(dec_data);
    // 객체의 모든 필드 출력
    for (const key in parsedData) {
      if (parsedData.hasOwnProperty(key)) {
        const value = parsedData[key];
        console.log(`${key}: ${value}`);
      }
    }
    // 인증결과 반환
    return res.status(200).json({
      status: 200,
      message: "본인인증 성공",
      data: [{
        name: parsedData.utf8_name,
        birthdate: parsedData.birthdate,
        gender: parsedData.gender,
        mobileno: parsedData.mobileno
      }],
    });
  } catch (error) {
    // JSON 파싱 오류 처리
    console.error('JSON 파싱 오류:', error);
  }
});


//회원가입 - ID 중복 확인
router.post("/signup/check-id", async (req, res) => {
  const body = req.body;
  try {
    const [[userSelectResult]] = await conn.execute(
      "SELECT id FROM user_profile WHERE usr_id = ?",
      [body.usr_id]
    );
    if (!userSelectResult) {
      return res.status(200).json({
        status: 200,
        message: "중복ID가 없습니다.",
        data: [],
      });
    } else {
      return res.status(400).json({
        status: 400,
        message: "해당 ID는 이미 존재합니다",
        data: [],
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 500,
      message: "요청을 처리하는 중에 에러가 발생했습니다.",
      data: [],
    });
  }
});

//회원가입 - 닉네임 중복 확인
router.post("/signup/check-nickname", async (req, res) => {
  const body = req.body;
  try {
    const [[userSelectResult]] = await conn.execute(
      "SELECT id FROM user_profile WHERE nickname = ?",
      [body.nickname]
    );
    if (!userSelectResult) {
      return res.status(200).json({
        status: 200,
        message: "중복닉네임이 없습니다.",
        data: [],
      });
    } else {
      return res.status(400).json({
        status: 400,
        message: "해당 닉네임은 이미 존재합니다",
        data: [],
      });
    }
  } catch (err) {
    return res.status(500).json({
      status: 500,
      message: "요청을 처리하는 중에 에러가 발생했습니다.",
      data: [],
    });
  }
});


// 회원 정보 입력
router.post("/signup/profile", async (req, res) => {
  const body = req.body;

  //null 체크 먼저
  const requiredFields = [
    "usr_id",
    "usr_pwd",
    "name",
    "nickname",
    "phonenumber",
    "gender",
    "birth",
  ];
  const invalidFields = requiredFields.filter((field) => !body[field]);

  if (invalidFields.length > 0) {
    return res.status(400).json({
      status: 400,
      message: `유효하지 않은 회원 정보입니다. 다음 값들이 입력되지 않았습니다: ${invalidFields.join(
        ", "
      )}`,
      data: [],
    });
  }

  // 성인 확인 함수
  function isAdult(birthdate) {
    // 문자열 형식이 YYYYMMDD 형식인지 검사
    const dateRegex = /^[0-9]{8}$/;
    if (!dateRegex.test(birthdate)) {
      throw new Error('Invalid date format. Please use YYYYMMDD format.');
    }
  
    // 생년월일 파싱
    const year = parseInt(birthdate.slice(0, 4), 10);
    const month = parseInt(birthdate.slice(4, 6), 10);
    const day = parseInt(birthdate.slice(6), 10);
  
    // 현재 날짜
    const currentDate = new Date();
  
    // 나이 계산
    const age = currentDate.getFullYear() - year;
    if (
      currentDate.getMonth() + 1 < month ||
      (currentDate.getMonth() + 1 === month && currentDate.getDate() < day)
    ) {
      age -= 1; // 생일이 안 지남
    }
    
    // 성인 확인
    if (age >= 19)
      return true;
    else
      return false;
  }

  // 성인 확인
  if (!isAdult(body.birth)){
    return res.status(210).json({
      status: 210,
      message: "성인이 아닙니다.",
      data: [],
    });
  }

  try {
    const user_profile = [
      body.usr_id,
      body.usr_pwd,
      body.name,
      body.nickname,
      body.phonenumber,
      body.gender,
      body.birth
    ];

    await conn.execute(
      "INSERT INTO user_profile (usr_id, usr_pwd, name, nickname, phonenumber, gender, birth) VALUES (?,?,?,?,?,?,?)",
      user_profile
    );

    return res.status(201).json({
      status: 201,
      message: "회원가입에 성공했습니다.",
      data: [],
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 500,
      message: "요청을 처리하는 중에 에러가 발생했습니다.",
      data: [],
    });
  }
});

//로그인
router.post("/signin", async (req, res) => {
  const body = req.body;

  try {
    const [queryResult] = await conn.execute(
      "SELECT * FROM user_profile WHERE usr_id = ?",
      [body.usr_id]
    );
    const userSelectResult = queryResult[0];
    if (userSelectResult.usr_pwd === body.usr_pwd) {
      const access_token = jwt.sign(
        {
          id: userSelectResult.usr_id,
          nick_name: userSelectResult.nickname,
        },
        process.env.SECRET,
        {
          issuer: "@juseung",
          expiresIn: "3h",
        }
      );

      const refresh_token = jwt.sign(
        {
          id: userSelectResult.usr_id,
          nick_name: userSelectResult.nickname,
        },
        process.env.REFRESH_SECRET,
        {
          issuer: "@juseung",
          expiresIn: "30d",
        }
      );

      // user_profile table에 refresh token 저장
      await conn.execute(
        "UPDATE user_profile SET refresh_token = ? WHERE usr_id = ?",
        [refresh_token, userSelectResult.usr_id]
      );

      //await redisLocalCon.set(recordedUserInfo.id, token);
      return res.status(200).json({
        status: 200,
        message: "로그인 성공! acess token과 refresh token이 발행됐습니다.",
        data: [
          {
            access_token: access_token,
            refresh_token: refresh_token,
          },
        ],
      });
    } else {
      return res.status(401).json({
        status: 401,
        message: "회원 정보가 일치하지 않습니다.",
        data: [],
      });
    }
  } catch (err) {
    return res.status(500).json({
      status: 500,
      message: "요청을 처리하는 중에 에러가 발생했습니다.",
      data: [],
    });
  }
});

//acessToken재발급
router.get("/signin/renew-token", async (req, res) => {
  //const { refresh_token } = req.body;
  const refreshToken = req.headers.authorization.replace(/^Bearer\s/, "");

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET, {
      ignoreExpiration: true,
    });
    // usr_id와 매칭된 row가 있으며 그 row에 저장된 refresh token과 값이 값다면
    if (
      userSelectResult.length > 0 &&
      userSelectResult[0].refresh_token === refreshToken
    ) {
      //단순히 문자열을 비교하는 것이 아님 . JWT생성할때 포함된 usr_id를 decode해서 db에 있는지 확인해봄.
      const [userSelectResult] = await conn.execute(
        "SELECT * FROM user_profile WHERE usr_id = ?",
        [decoded.id]
      );
      // 새로운 jwt 발급
      const accessToken = jwt.sign(
        {
          id: userSelectResult[0].usr_id,
          nick_name: userSelectResult[0].nickname,
        },
        process.env.SECRET,
        {
          issuer: "@juseung",
          expiresIn: "3h",
        }
      );
      return res.status(200).json({
        status: 200,
        message: "access token이 재발급됐습니다.",
        data: [{ access_token: accessToken }],
      });
    }
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        status: 403,
        message: "헤더의 refresh token과 DB의 refresh token이 일치하지 않습니다.",
        data: [],
      });
    } else {
      console.log(err)
      return res.status(500).json({
        status: 500,
        message: "요청을 처리하는 중에 에러가 발생했습니다.",
        data: [],
      });
    }
  }
});

//아이디 찾기
router.post("/find-id", async (req, res) => {
  const body = req.body;
  try {
    const [[rows]] = await conn.execute(
      "SELECT usr_id FROM user_profile WHERE phonenumber = ?",
      [body.phonenumber]
    );
    //쿼리 돌렸을 때 일치하는거 없으면 undefined라 false. rows를 조건문에 넣은 것은 있는지 없는지
    if (rows && rows.length !== 0) {
      return res.status(200).json({
        status: 200,
        message: "해당 회원의 ID입니다.",
        data: [{ usr_id: rows.usr_id }],
      });
    } else {
      return res.status(404).json({
        status: 404,
        message: "회원가입된 유저가 없습니다.",
        data: [],
      });
    }
  } catch (err) {
    return res.status(500).json({
      status: 500,
      message: "요청을 처리하는 중에 에러가 발생했습니다.",
      data: [],
    });
  }
});

//change password
router.post("/change-pwd", async (req, res) => {
  const body = req.body;
  try {
    const [userSelectResult] = await conn.execute(
      "SELECT usr_pwd FROM user_profile WHERE usr_id = ?",
      [body.usr_id]
    );
    console.log(userSelectResult);
    if (!userSelectResult || userSelectResult.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "일치하는 회원이 존재하지 않습니다.",
        data: [],
      });
    }

    if (userSelectResult[0].usr_pwd == body.new_usr_pwd) {
      return res.status(400).json({
        status: 400,
        message: "기존 비밀번호와 동일한 비밀번호는 사용할 수 없습니다.",
        data: [],
      });
    }

    await conn.execute("UPDATE user_profile SET usr_pwd = ? WHERE usr_id = ?", [
      body.new_usr_pwd,
      body.usr_id,
    ]);

    return res.status(200).json({
      status: 200,
      message: "비밀번호를 성공적으로 변경했습니다.",
      data: [],
    });
  } catch (err) {
    return res.status(500).json({
      status: 500,
      message: "요청을 처리하는 중에 에러가 발생했습니다.",
      data: [],
    });
  }
});

export default router;