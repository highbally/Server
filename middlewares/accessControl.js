import jwt from "jsonwebtoken";
import sqlCon from "../db/sqlCon.js";
const conn = sqlCon();
//JWT Token 검증 + 블랙리스트에 엑세스 토큰이 있는지 확인
const verifyToken = async (req, res, next) => {
  try {
    const accessToken = req.headers.authorization.replace(/^Bearer\s/, "");

    // Check if the access token exists in the blacklist
    const [blacklistResult] = await conn.execute(
      "SELECT COUNT(*) as count FROM blacklist WHERE access_token = ?",
      [accessToken]
    );

    const isRevoked = blacklistResult[0].count > 0;

    if (isRevoked) {
      return res.status(401).json({
        error: "Invalid Token",
        message: "유효한 토큰이 아닙니다. 다시 로그인하여 주십시오.",
      });
    }

    req.decoded = jwt.verify(accessToken, process.env.SECRET);

    if (req.decoded.allowResult) {
      return res.status(401).json({
        error: "Invalid Token",
        message: "엑세스 토큰이 유효하지 않습니다.",
      });
    }

    const queryResult = await conn.execute(
      "SELECT * FROM user_profile WHERE usr_id = ?",
      [req.decoded.id]
    );

    const DBSearchResult = queryResult[0][0];
    if (DBSearchResult !== null) {
      return next();
    } else {
      throw new Error("TokenExpiredError");
    }
  } catch (err) {
    if (err.name == "TokenExpiredError") {
      return res.status(403).json({
        error: "403 Forbidden",
        message: "토큰이 만료됐습니다.",
      });
    }
    console.log(err);
    return res.status(403).json({
      error: "403 Forbidden",
      message: "유효하지 않은 토큰입니다.",
    });
  }
};

export default verifyToken;
