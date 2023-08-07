import express from "express";
import sqlCon from "../db/sqlCon.js";
import verifyToken from "../middlewares/accessControl.js";
const conn = sqlCon();
const router = express.Router();

/* 특정 유저가 로그인 했을 시 생기는 토큰으로 유저 정보 출력(토큰 검증) */
router.get("/", verifyToken, async (req, res, next) => {
  try {
    const [queryResult] = await conn.execute(
      "SELECT * FROM user_profile WHERE usr_id = ?",
      [req.decoded.id]
    );
    console.log(queryResult[0]);
    return res.status(200).json({
      status: 200,
      message: "로그인 성공하 유저 정보입니다.",
      data: queryResult[0],
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      message: "요청을 처리하는 동안 에러가 발생했습니다.",
      data: {},
    });
  }
});

export default router;
