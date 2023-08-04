import express from "express";
import sqlCon from "../db/sqlCon.js";
import verifyToken from "../middlewares/accessControl.js";
// import cron from "node-cron";
const conn = sqlCon();
const router = express.Router();

//하단 바 마이페이지 눌렀을 때
router.get("/", verifyToken, async (req, res, next) => {
  try {
    const [usrInfo] = await conn.execute(
      "SELECT nickname, subscribed FROM user_profile WHERE usr_id = ?",
      [req.decoded.id]
    );

    return res.status(200).json({
      status: 200,
      message: "마이페이지 유저 닉네임과 구독여부 입니다.",
      data: {
        nickname: usrInfo[0].nickname,
        subscribed: usrInfo[0].subscribed,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: 500,
      message: "요청을 처리하는 중에 애러가 발생했습니다.",
      data: [],
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
      message: "요청을 처리하는 중에 애러가 발생했습니다.",
      data: [],
    });
  }
});

// //프로필 수정 - 사진과 닉네임(근데 로컬에 있는 사진은 경로만 들고와서는 안될텐데)
// router.post("/update", verifyToken, async (req, res, next) => {
//   const body = req.body;
//   try {
//     await conn.execute(
//       "UPDATE user_profile SET picture = ? , nickname = ? WHERE usr_id =?",
//       [body.picture, body.nickname, req.decoded.id]
//     );

//     return res.status(200).json({
//       status: 200,
//       message: "회원 정보를 정상적으로 수정했습니다.",
//     });
//   } catch (err) {
//     return res.status(500).json({
//       status: 500,
//       message: "요청을 처리하는 중에 애러가 발생했습니다.",
//       data: [],
//     });
//   }
// });

//마이페이지 - 계정관리 - 비밀 번호 변경
router.post("/account/change-pwd", verifyToken, async (req, res, next) => {
  const body = req.body;
  try {
    const [queryResult] = await conn.execute(
      "SELECT usr_pwd FROM user_profile WHERE usr_id = ?",
      [req.decoded.id]
    );
    console.log(queryResult[0].usr_pwd);
    console.log(body.usr_pwd);
    if (body.usr_pwd === queryResult[0].usr_pwd) {
      await conn.execute(
        "UPDATE user_profile SET  usr_pwd = ? WHERE usr_id =?",
        [body.new_usr_pwd, req.decoded.id]
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
    await conn.execute("DELETE FROM user_profile WHERE usr_id = ?", [
      req.decoded.id,
    ]);
    return res.status(200).json({
      status: 200,
      message: "정상적으로 계정을 탈퇴 하였습니다.",
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

export default router;
