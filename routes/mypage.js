import express from "express";
import sqlCon from "../db/sqlCon.js";
import verifyToken from "../middlewares/accessControl.js";
// import cron from "node-cron";
const conn = sqlCon();
const router = express.Router();

import crypto from 'crypto';
import util from "util";
const randomBytesPromise = util.promisify(crypto.randomBytes);
const pbkdf2Promise = util.promisify(crypto.pbkdf2);
//비밀번호 암호화용 메소드
const createSalt = async () => {
  const buf = await randomBytesPromise(64);
  return buf.toString("base64");
};
const createHashedPassword = async (password) => {
  const salt = await createSalt();
  const key = await pbkdf2Promise(password, salt, 104906, 64, "sha512");
  const hashedPassword = key.toString("base64");
  return { hashedPassword, salt };
};
//비밀번호 검증
const verifyPassword = async (password, userSalt, userPassword) => {
  const key = await pbkdf2Promise(password, userSalt, 104906, 64, "sha512");
  const hashedPassword = key.toString("base64");
  if (hashedPassword === userPassword) return true;
  return false;
};


//하단 바 마이페이지 눌렀을 때
router.get("/", verifyToken, async (req, res, next) => {
  try {
    const [queryResult] = await conn.execute(
      "SELECT nickname, subscribed, available FROM user_profile WHERE usr_id = ?",
      [req.decoded.id]
    );
    const usrInfo = queryResult[0]
    return res.status(200).json({
      status: 200,
      message: "마이페이지 유저 닉네임과 구독여부 입니다.",
      data: [{nickname: usrInfo.nickname, subscribed: usrInfo.subscribed, available: usrInfo.available}]

    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 500,
      message: "요청을 처리하는 중에 애러가 발생했습니다.",
      data: []
    });
  }
});

//닉네임 중복하기는 auth에 있는거 그대로 쓰기, jwt확인만 추가
//회원가입 - 닉네임 중복 확인
router.post("/check-nickname", verifyToken, async (req, res) => {
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

//프로필 수정 - 사진과 닉네임(근데 로컬에 있는 사진은 경로만 들고와서는 안될텐데)
router.post("/update", verifyToken, async (req, res, next) => {
  const body = req.body;
  try {
    await conn.execute(
      "UPDATE user_profile SET picture = ? , nickname = ? WHERE usr_id =?",
      [body.picture, body.nickname, req.decoded.id]
    );

    return res.status(200).json({
      status: 200,
      message: "회원 정보를 정상적으로 수정했습니다.",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "요청을 처리하는 중에 애러가 발생했습니다.",
    });
  }
});

//마이페이지 - 계정관리 - 비밀 번호 변경
router.post("/account/change-pwd", verifyToken, async (req, res, next) => {
  const body = req.body;
  try {
    const [userQueryResult] = await conn.execute(
      "SELECT usr_id, usr_pwd, salt FROM user_profile WHERE usr_id = ?",
      [req.decoded.id]
    );
    
    const queryResult = userQueryResult[0];
    const isPasswordValid = await verifyPassword(body.usr_pwd, queryResult.salt, queryResult.usr_pwd)
    if (isPasswordValid) {
      const isNewPasswordValid = await verifyPassword(body.new_usr_pwd, queryResult.salt, queryResult.usr_pwd)

      console.log(isNewPasswordValid, isPasswordValid)
      // 새로운 비밀번호로 현재 로그인이 된다면 똑같은 비밀번호로 수정하는 것이므로 막고 이거 확인 후에 기존거랑 같지 않다면 비밀번호 재설정 로직 수행
      if(isNewPasswordValid) {
      return res.status(400).json({
        status: 400,
        message: "기존 비밀번호와 동일한 비밀번호는 사용할 수 없습니다.",
        data: [],
      });
      }

      const { hashedPassword, salt } = await createHashedPassword(body.new_usr_pwd);
      console.log(hashedPassword)
      console.log(queryResult.usr_pwd)
      await conn.execute(
        "UPDATE user_profile SET usr_pwd = ?, salt = ? WHERE usr_id = ?",
        [hashedPassword, salt, queryResult.usr_id]
      );
      return res.status(200).json({
        status: 200,
        message: "회원 비밀번호를 정상적으로 수정했습니다.",
        data: [],
      });
    } else {
      return res.status(404).json({
        status: 404,
        message: "입력하신 비밀번호가 일치하지 않습니다.",
        data: [],
      });
    }
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      status: 500,
      message: "요청을 처리하는 중에 애러가 발생했습니다.",
      data: [],
    });
  }
});

//로그아웃 - 엑세스 토큰 무효화, 리프레쉬 토큰 디비에서 제거
router.get("/account/signout", verifyToken, async (req, res, next) => {
  try {
    const access_token = req.headers.authorization.replace("Bearer ", "");
    await conn.execute(
      "UPDATE user_profile SET refresh_token = NULL WHERE usr_id = ?",
      [req.decoded.id]
    );
    await conn.execute("INSERT INTO blacklist (access_token) VALUES (?)", [
      access_token,
    ]);

    return res.status(200).json({
      status: 200,
      message: "정상적으로 로그아웃 하였습니다.",
      data: [],
    });
  } catch (err) {
    return res.status(500).json({
      status: 500,
      message: "요청을 처리하는 중에 애러가 발생했습니다.",
      data: [],
    });
  }
});

//계정 탈퇴
router.get("/account/withdraw", verifyToken, async (req, res, next) => {
  try {
    const user_id = req.decoded.id;
    // const [[userQueryResult]] = await conn.execute("SELECT id FROM user_profile WHERE usr_id = ?", [
    //   user_id
    // ]);
    // await conn.execute("DELETE FROM usage_history WHERE id = ?", [
    //   userQueryResult.id
    // ]);
    await conn.execute("DELETE FROM user_profile WHERE usr_id = ?", [
      user_id
    ]);
    return res.status(200).json({
      status: 200,
      message: "정상적으로 계정을 탈퇴 하였습니다.",
      data: []
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 500,
      message: "요청을 처리하는 중에 애러가 발생했습니다.",
      data: []
    });
  }
});

// cron.schedule("* * * * *", async () => {
//   const expirationTime = Date.now() - 13 * 60 * 1000;
//   const formattedExpirationTime = new Date(expirationTime)
//     .toISOString()
//     .replace(".000Z", "");

//   console.log(formattedExpirationTime);

//   try {
//     await conn.execute("DELETE FROM blacklist WHERE created_at < ?", [
//       formattedExpirationTime,
//     ]);
//     console.log("Expired tokens removed from the blacklist.");
//   } catch (err) {
//     console.log("Error removing expired tokens from the blacklist:", err);
//   }
// });

/***
 * 7일 이용권
 */
export default router;
