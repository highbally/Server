import express from "express";
import sqlCon from "../db/sqlCon.js";
import verifyToken from "../middlewares/accessControl.js";
const conn = sqlCon();
const router = express.Router();

//근데 생각해보니까 굳이 이렇게되면 qr 코드가 필요없이 바로 text입력하는 곧으로 이동하면 안되나?
router.get("/", verifyToken, async (req, res, next) => {
  try {
    const [userInfo] = await conn.execute(
      "SELECT id, subscribed, availability FROM user_profile WHERE usr_id = ?",
      [req.decoded.id]
    );
    const subscribed = userInfo[0].subscribed;
    const availability = userInfo[0].availability;

    //사용 기록 테이블에 사용한적 있는지 check -> 이미 사용한 case고려해주기
    if (subscribed === 1 && availability === 1) {
      const api_url =
        "https://chart.apis.google.com/chart?cht=qr&chs=300x300&chl=";
      const qr_url = `https://${process.env.HOST}:${
        process.env.PORT
      }/execute?usrId=${userInfo[0].id}&time=${new Date()}`;
      return res.status(200).json({
        status: 200,
        message: "하이볼리에 구독하신 회원님의 qr코드 요청 응답입니다.",
        // authenticationUrl: authenticationUrl, ->형식 문제 때문에 encodeURIComponent()씀
        qrCodeUrl: api_url + encodeURIComponent(qr_url),
      });
    } else if (subscribed === 0 && availability === 1) {
      return res.status(404).json({
        status: 404,
        error: "Not Found",
        message: "하이볼리 구독자가 아닙니다.",
      });
    } else if (subscribed === 1 && availability === 0) {
      return res.status(404).json({
        status: 404,
        error: "Already Used",
        message: "이미 사용하셨습니다.",
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "요청을 처리하는 중에 애러가 발생했습니다.",
    });
  }
});

router.get("/execute", verifyToken, async (req, res, next) => {
  //랜더링 시켜주기
});

//그냥 db에서 해당 업체 코드 입력하면 알아서 가게 정보 인증
router.post("/execute/verify", verifyToken, async (req, res, next) => {
  try {
    const body = req.body;
    const [queryResult] = await conn.execute(
      "SELECT restaurant_id, name FROM restaurant_info WHERE code = ?",
      [body.code]
    );
    const restaurant_id = queryResult[0].restaurant_id;
    const [highballQueryResult] = await conn.execute(
      "SELECT name FROM highball_info WHERE restaurant_id = ?",
      [restaurant_id]
    );
    const highballs = highballQueryResult.map((rows) => rows.name);
    console.log(highballQueryResult);
    return res.status(200).json({
      status: 200,
      message: "가게 인증 성공",
      restaurant: queryResult[0].name,
      highball: highballs,
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

//서비스 사용 정보 저장 -> 각 요청 정보가 디비에 실제로 존재하는지 체크해야할까?
router.post("/record", verifyToken, async (req, res, next) => {
  const body = req.body;
  try {
    await conn.execute(
      "INSERT INTO usage_history (usr_id, restaurant_name, highball_name, time) VALUES (?, ?, ?, NOW())",
      [req.decoded.id, body.restaurant_name, body.highball_name]
    );
    await conn.execute(
      "UPDATE user_profile SET availability = false WHERE usr_id = ?",
      [req.decoded.id]
    );
    return res.status(200).json({
      status: 200,
      message: "서비스 사용 기록이 성공적으로 저장됐습니다.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "요청을 처리하는 중에 애러가 발생했습니다.",
    });
  }
});

router.get("/reset", async (req, res, next) => {
  try {
    await conn.execute("UPDATE user_profile SET availability = true");
    return res.status(200).json({
      status: 200,
      message: "오후 3시이므로 이용 가능 여부가 리셋 되었습니다.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "요청을 처리하는 중에 애러가 발생했습니다.",
    });
  }
});

export default router;
