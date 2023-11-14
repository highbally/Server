import express from "express";
import sqlCon from "../db/sqlCon.js";
const conn = sqlCon();
const router = express.Router();

//user_profile 정보 반환
// router.get("/index/absfhjgbauhrfbdvajksdvbjasfbvijafbvgjaidfjhasbf", async function (req, res, next) {
//   const DBSearchResult = await conn.execute("SELECT * FROM user_profile");
//   console.log(DBSearchResult[0]);
//   return res.send(DBSearchResult[0]);
// });
export default router;
