import express from "express";
import sqlCon from "../db/sqlCon.js";
import verifyToken from "../middlewares/accessControl.js";
const conn = sqlCon();
const router = express.Router();

/* 특정 유저가 로그인 했을 시 생기는 토큰으로 유저 정보 출력(토큰 검증) */
router.get("/", verifyToken, async (req, res, next) => {
  try {
    const queryResult = await conn.execute(
      "SELECT * FROM user_profile WHERE usr_id = ?",
      [req.decoded.id]
    );
    console.log(queryResult[0]);
    return res.status(200).json({
      specific_user_info: queryResult[0],
    });
  } catch (err) {
    console.log(err);
    return res.status(406).json({
      error: "invalid token",
      message: "엑세스 토큰이 올바르지 않습니다.",
    });
  }
});

export default router;
