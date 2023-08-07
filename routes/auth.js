import express from "express";
import sqlCon from "../db/sqlCon.js";
import jwt from "jsonwebtoken";
import moment from "moment";
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
  const phonenumber = req.body.phonenumber;

  Cache.del(phonenumber);

  //인증번호 생성
  const verifyCode = Math.floor(Math.random() * (999999 - 100000)) + 100000;
  Cache.put(phonenumber, verifyCode.toString());

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
          to: `${phonenumber}`,
        },
      ],
    },
  })
    .then(function (axiosRes) {
      console.log(err);
      res.status(200).json({
        status: 200,
        message: `${phonenumber}로 인증번호 전송에 성공했습니다.`,
        data: {},
      });
    })
    .catch((err) => {
      if (err.res == undefined) {
        res.status(200).json({
          status: 200,
          message: `${phonenumber}로 인증번호 전송에 성공했습니다.`,
          data: {},
        });
      } else {
        console.log(err);
        console.log(err);
        res.status(401).json({
          status: 401,
          message: `${phonenumber}로 인증번호 전송에 실패했습니다.`,
          data: {},
        });
      }
    });
});

//본인 인증 - 인증번호 확인
router.post("/signup/verify", async (req, res) => {
  const phonenumber = req.body.phonenumber;
  const verifyCode = req.body.verifyCode;

  const CacheData = Cache.get(phonenumber);

  if (!CacheData) {
    return res.status(400).json({
      status: 400,
      message: "인증번호를 입력해주세요.",
      data: {},
    });
  } else if (CacheData !== verifyCode) {
    return res.status(400).json({
      status: 400,
      message: "인증번호가 일치하지 않습니다.",
      data: {},
    });
  } else {
    Cache.del(phonenumber);
    return res.status(200).json({
      status: 200,
      message: "인증에 성공했습니다.",
      data: {},
    });
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
        data: {},
      });
    } else {
      return res.status(400).json({
        status: 400,
        message: "해당 ID는 이미 존재합니다",
        data: {},
      });
    }
  } catch (err) {
    return res.status(500).json({
      status: 500,
      message: "요청을 처리하는 중에 에러가 발생했습니다.",
      data: {},
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
        data: {},
      });
    } else {
      return res.status(400).json({
        status: 400,
        message: "해당 닉네임은 이미 존재합니다",
        data: {},
      });
    }
  } catch (err) {
    return res.status(500).json({
      status: 500,
      message: "요청을 처리하는 중에 에러가 발생했습니다.",
      data: {},
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
      data: {},
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
      moment.utc(body.birth, "YYYYMMDD", "Asia/Seoul").format("YYYY-MM-DD"),
    ];
    await conn.execute(
      "INSERT INTO user_profile (usr_id, usr_pwd, name, nickname, phonenumber, gender, birth) VALUES (?,?,?,?,?,?,?)",
      user_profile
    );

    return res.status(201).json({
      status: 201,
      message: "회원가입에 성공했습니다.",
      data: {},
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 500,
      message: "요청을 처리하는 중에 에러가 발생했습니다.",
      data: {},
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
      const access_token = jwt.sign(
        {
          id: userSelectResult.usr_id,
          nick_name: userSelectResult.nickname,
        },
        process.env.SECRET,
        {
          issuer: "@juseung",
          expiresIn: "1h",
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
          expiresIn: "7d",
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
        data: {
          access_token: access_token,
          refresh_token: refresh_token,
        },
      });
    } else {
      return res.status(401).json({
        status: 401,
        message: "회원 정보가 일치하지 않습니다.",
        data: {},
      });
    }
  } catch (err) {
    return res.status(500).json({
      status: 500,
      message: "요청을 처리하는 중에 에러가 발생했습니다.",
      data: {},
    });
  }
});

// acessToken재발급
router.post("/signin/renew-token", async (req, res) => {
  const { refresh_token } = req.body;

  try {
    const decoded = jwt.verify(refresh_token, process.env.REFRESH_SECRET);

    //단순히 문자열을 비교하는 것이 아님 . JWT생성할때 포함된 usr_id를 decode해서 db에 있는지 확인해봄.
    const [userSelectResult] = await conn.execute(
      "SELECT * FROM user_profile WHERE usr_id = ?",
      [decoded.id]
    );

    // usr_id와 매칭된 row가 있으며 그 row에 저장된 refresh token과 값이 값다면
    if (
      userSelectResult.length > 0 &&
      userSelectResult[0].refresh_token === refresh_token
    ) {
      // 새로운 jwt 발급
      const accessToken = jwt.sign(
        {
          id: userSelectResult[0].usr_id,
          nick_name: userSelectResult[0].nickname,
        },
        process.env.SECRET,
        {
          issuer: "@juseung",
          expiresIn: "1h",
        }
      );
      return res.status(200).json({
        status: 200,
        message: "acess token이 재발급됐습니다.",
        data: { acess_token: accessToken },
      });
    }
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        status: 401,
        message: "유효하지 않은 refresh token입니다.",
        data: {},
      });
    } else {
      return res.status(500).json({
        status: 500,
        message: "요청을 처리하는 중에 에러가 발생했습니다.",
        data: {},
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
        data: { usr_id: rows.usr_id },
      });
    } else {
      return res.status(404).json({
        status: 404,
        message: "회원가입된 유저가 없습니다.",
        data: {},
      });
    }
  } catch (err) {
    return res.status(500).json({
      status: 500,
      message: "요청을 처리하는 중에 에러가 발생했습니다.",
      data: {},
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
        data: {},
      });
    }

    if (userSelectResult[0].usr_pwd == body.new_usr_pwd) {
      return res.status(400).json({
        status: 400,
        message: "기존 비밀번호와 동일한 비밀번호는 사용할 수 없습니다.",
        data: {},
      });
    }

    await conn.execute("UPDATE user_profile SET usr_pwd = ? WHERE usr_id = ?", [
      body.new_usr_pwd,
      body.usr_id,
    ]);

    return res.status(200).json({
      status: 200,
      message: "비밀번호를 성공적으로 변경했습니다.",
      data: {},
    });
  } catch (err) {
    return res.status(500).json({
      status: 500,
      message: "요청을 처리하는 중에 에러가 발생했습니다.",
      data: {},
    });
  }
});

export default router;
