import jwt from "jsonwebtoken";
import sqlCon from "../db/sqlCon.js";
const conn = sqlCon();

const verifyAccess = async (req, res, next) => {
  const accessToken = req.headers.authorization?.replace(/^Bearer\s/, "");
  console.log(accessToken);
  const decoded = jwt.verify(accessToken, process.env.SECRET, {
    ignoreExpiration: true,
  });
  try {
    if (!accessToken) {
      next();
      return;
    }
  } catch (err) {
    console.log(err.name);
    if (err.name === "TokenExpiredError") {
      
      const accessToken = jwt.sign({
        id: decoded.audid,
        nick_name: decoded.nick_name,
      },
      process.env.SECRET,
      {
        issuer: "@juseung",
        expiresIn: "1h",
      });
      return res.status(200).json({
        status: 200,
        message: "access token이 재발급됐습니다. 새 access token입니다.",
        data: [{ new_acess_token: accessToken }],
      });
    } else {
      console.log(err);
      return res.status(500).json({
        status: 500,
        message: "An error occurred while processing the request.",
        data: [],
      });
    }
  }
};

export default verifyAccess;
