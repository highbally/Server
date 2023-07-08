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
      "SELECT * FROM user_profile WHERE usr_id = ?",
      [body.usr_id]
    );
    if (userSelectResult.length === 0) {
      return res.status(200).json({
        status: 200,
        message: "중복ID가 없습니다.",
        issue: "해당ID로 진행할 수 있습니다.",
      });
    } else {
      return res.status(400).json({
        status: 400,
        error: "Bad Request",
        message: "해당 ID는 이미 존재합니다",
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "중복 ID를 확인하는 동안 오류가 발생했습니다.",
    });
  }
});

//회원가입 - 닉네임 중복 확인
router.post("/signup/check-nickname", async (req, res) => {
  const body = req.body;
  try {
    const [userSelectResult, fieldUser] = await conn.execute(
      "SELECT * FROM user_profile WHERE nickname = ?",
      [body.nickname]
    );
    if (userSelectResult.length === 0) {
      return res.status(200).json({
        status: 200,
        message: "중복닉네임이 없습니다.",
        issue: "해당 닉네임으로 진행할 수 있습니다.",
      });
    } else {
      return res.status(400).json({
        status: 400,
        error: "Bad Request",
        message: "해당 닉네임은 이미 존재합니다",
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "중복 닉네임을 확인하는 동안 오류가 발생했습니다.",
    });
  }
});

/// 회원 정보 입력
router.post("/signup/profile", async (req, res) => {
  const body = req.body;

  // null이거나 빈 값 확인
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
      error: "Bad Request",
      message: `유효하지 않은 회원 정보입니다. 다음 값들이 입력되지 않았습니다: ${invalidFields.join(
        ", "
      )}`,
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
      body.birth,
    ];
    await conn.execute(
      "INSERT INTO user_profile (usr_id, usr_pwd, name, nickname, phonenumber, gender, birth) VALUES (?,?,?,?,?,?,?)",
      user_profile
    );

    return res.status(201).json({
      status: 201,
      message: "회원가입에 성공했습니다.",
      issue: "암호화 시간이 조금 소요될 수 있으니 기다려주세요.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "Server Error",
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
    console.log(userSelectResult);
    if (userSelectResult.usr_pwd === body.usr_pwd) {
      const token = jwt.sign(
        {
          id: userSelectResult.usr_id,
          nick_name: userSelectResult.nickname,
        },
        process.env.SECRET,
        {
          issuer: "@juseung",
        }
      );

      //await redisLocalCon.set(recordedUserInfo.id, token);
      return res.status(200).json({
        status: 200,
        message: "로그인 성공! 토큰은 DB에 저장되어 관리됩니다.",
        issue: "암호화 시간이 조금 소요될 수 있으니 기다려주세요.",
        token,
      });
    } else {
      return res.status(401).json({
        status: 401,
        error: "Unauthorized",
        message: "비밀번호가 일치하지 않습니다.",
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "서버 오류",
    });
  }
});

//아이디 찾기
router.post("/find-id", async (req, res) => {
  const body = req.body;
  try {
    const [rows, fields] = await conn.execute(
      "SELECT usr_id FROM user_profile WHERE phonenumber = ?",
      [body.phonenumber]
    );

    if (rows.length !== 0) {
      const userID = rows.map((row) => row.usr_id);
      return res.status(200).json({
        status: 200,
        message: "회원가입된 유저입니다.",
        issue: "일치하는 유저 아이디 입니다.",
        usr_id: userID,
      });
    } else {
      return res.status(404).json({
        status: 404,
        error: "Not Found",
        message: "회원가입된 유저가 없습니다.",
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "서버 오류",
    });
  }
});

//change password
router.post("/change-pwd", async (req, res) => {
  const body = req.body;
  try {
    const [userSelectResult, fields] = await conn.execute(
      "SELECT * FROM user_profile WHERE usr_id = ?",
      [body.usr_id]
    );
    console.log(userSelectResult);
    if (userSelectResult.length !== 0) {
      // const existingPassword = userSelectResult[0].usr_pwd;
      await conn.execute(
        "UPDATE user_profile SET usr_pwd = ? WHERE usr_id = ?",
        [body.new_usr_pwd, body.usr_id]
      );
      return res.status(200).json({
        status: 200,
        message: "비밀번호를 변경했습니다.",
        issue: "비밀번호를 성공적으로 변경했습니다.",
      });
    } else {
      return res.status(404).json({
        status: 404,
        error: "Not Found",
        message: "유저를 찾을 수 없습니다.",
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "서버 오류",
    });
  }
});

export default router;
