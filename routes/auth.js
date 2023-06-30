import express from "express";
import sqlCon from "../db/sqlCon.js";
import jwt from "jsonwebtoken";
const conn = sqlCon();
const router = express.Router();

import axios from "axios";
import Cache from "memory-cache";
import CryptoJS from "crypto-js";

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

//회원가입 - ID 중복 확인
router.post("/signup/check-id", async (req, res) => {
  const body = req.body;
  try {
    const [userSelectResult, fieldUser] = await conn.execute(
      "SELECT * FROM user_auth_info WHERE user_id = ?",
      [body.user_id]
    );
    if (userSelectResult.length === 0) {
      return res.status(200).json({
        message: "중복ID가 없습니다.",
        issue: "해당ID로 진행할 수 있습니다.",
      });
    } else {
      return res.status(400).json({
        error: "Bad Request",
        message: "해당 ID는 이미 존재합니다",
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "중복 ID를 확인하는 동안 오류가 발생했습니다.",
    });
  }
});

//회원가입 - ID,PWD - 중복 아이디 확인 후 하는거라 무조건 pass
router.post("/signup", async (req, res) => {
  const body = req.body;
  try {
    const userInfo = [body.user_id, body.pwd]; // 프론트 form 태그 내부 input의 name 속성과 같은 값
    await conn.execute("INSERT INTO user_auth_info VALUES (?,?)", userInfo);

    console.log("회원 DB 저장 성공");
    return res.status(201).json({
      message: "회원가입에 성공했습니다. 회원의 비밀번호는 암호화 처리됩니다.",
      issue: "암호화 시간이 조금 소요될 수 있으니 기다려주세요.",
    });
  } catch (err) {
    console.error(err);
    return res.status(406).json({
      error: "Not Acceptable",
      message: "올바르지 않은 회원 정보입니다.",
    });
  }
});

//회원가입 - 회원 정보 입력
router.post("/signup/profile", async (req, res) => {
  const body = req.body;

  try {
    const userProfile = [
      body.user_id,
      body.nick_name,
      body.phone_number,
      body.gender,
      body.birth,
    ];
    await conn.execute(
      "INSERT INTO user_profile VALUES (?,?,?,?,?)",
      userProfile
    );

    return res.send("회원정보가 정상적으로 저장되었습니다.");
  } catch (err) {
    console.log(err);
    return res.send("회원정보 저장에 실패했습니다.");
  }
});

//로그인
router.post("/signin", async (req, res) => {
  const body = req.body;

  try {
    const [queryResult] = await conn.execute(
      "SELECT * FROM user_auth_info WHERE user_id = ?",
      [body.user_id]
    );
    const userSelectResult = queryResult[0];
    console.log(userSelectResult);
    if (userSelectResult.password === body.pwd) {
      const token = jwt.sign(
        {
          id: userSelectResult.user_id,
          nick_name: userSelectResult.nick_name,
        },
        process.env.SECRET,
        {
          issuer: "@juseung",
        }
      );

      //await redisLocalCon.set(recordedUserInfo.id, token);
      return res.status(200).json({
        message: "로그인 성공! 토큰은 DB에 저장되어 관리됩니다.",
        issue: "암호화 시간이 조금 소요될 수 있으니 기다려주세요.",
        token,
      });
    } else {
      return res.status(409).json({
        error: "Conflict",
        message: "비밀번호가 일치하지 않습니다.",
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(406).json({
      error: "Not Acceptable",
      message: "회원 가입되지 않은 회원입니다.",
    });
  }
});

//아이디 찾기
router.post("/find-id", async (req, res) => {
  const body = req.body;
  try {
    const [rows, fields] = await conn.execute(
      "SELECT user_id FROM user_profile WHERE nickname = ? AND phone_number = ?",
      [body.nick_name, body.phone_number]
    );

    if (rows.length !== 0) {
      const userID = rows.map((row) => row.user_id);
      return res.status(200).json({
        message: "회원가입된 유저입니다.",
        issue: "일치하는 유저 아이디 입니다.",
        user_id: userID,
      });
    } else {
      return res.status(404).json({
        error: "Not Signup",
        message: "회원가입된 유저가 없습니다.",
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "서버 오류",
    });
  }
});

//비밀번호 바꾸기
router.post("/change-pwd", async (req, res) => {
  const body = req.body;
  try {
    const [userSelectResult, fields] = await conn.execute(
      "SELECT * FROM user_auth_info WHERE user_id = ?",
      [body.user_id]
    );
    console.log(userSelectResult);
    if (userSelectResult !== 0) {
      const existingPassword = userSelectResult[0].password;
      await conn.execute(
        "UPDATE user_auth_info SET password = ? WHERE user_id = ?",
        [body.newPwd, body.user_id]
      );
      return res.status(200).json({
        message: "비밀번호를 수정했습니다.",
        issue: "비밀번호를 성공적으로 수정했습니다.",
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "서버 오류",
    });
  }
});

export default router;
