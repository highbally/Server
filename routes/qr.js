import express from "express";
import sqlCon from "../db/sqlCon.js";
import verifyToken from "../middlewares/accessControl.js";
import cron from "node-cron";
const conn = sqlCon();
const router = express.Router();

// QR코드 URL 생성
router.get("/create", verifyToken, async (req, res, next) => {
  try {
    const [userSelectResult] = await conn.execute(
      "SELECT * FROM user_profile WHERE usr_id = ?",
      [req.decoded.id]
    );

    const subscribed = userSelectResult[0].subscribed;
    const available = userSelectResult[0].available;

    if (subscribed === 1 && available === 1) {
      // QR코드 활성화
      await conn.execute(
        "UPDATE user_profile SET qr_activated = true WHERE id = ?",
        [userSelectResult[0].id]
      );
      // QR코드 생성(시간을 안넣으면 QR코드가 매번 똑같을까봐 넣음) -> 그냥 id를 사용하면 연산을 더 줄일 수 있다. 어때?
      const api_url =
        "https://chart.apis.google.com/chart?cht=qr&chs=300x300&chl=";
      const qr_url = `${process.env.HOST}:${process.env.PORT}/qr/auth
                      ?id=${userSelectResult[0].id}&time=${new Date()}`;

      const encodedQrUrl = api_url + encodeURIComponent(qr_url);
      //헤더의 Content-Type을 image/png로 바꿔서 이미지가 가도록 함
      res.status(200).json({
        status: 200,
        message: "QR Code URL입니다.",
        data: encodedQrUrl,
      });
    } else if (subscribed === 0) {
      return res.status(404).json({
        status: 404,
        message: "하이볼 구독자가 아닙니다.",
        data: {},
      });
    } else if (subscribed === 1 && available === 0) {
      return res.status(404).json({
        status: 404,
        message: "이미 사용하셨습니다.",
        data: {},
      });
    }
  } catch (err) {
    return res.status(500).json({
      status: 500,
      message: "요청을 처리하는 중에 애러가 발생했습니다.",
      data: {},
    });
  }
});

// QR코드가 유효한지 판단
router.get("/auth", async (req, res) => {
  const id = req.query.id;
  try {
    const [userSelectResult] = await conn.execute(
      "SELECT * FROM user_profile WHERE id = ?",
      [id]
    );
    if (userSelectResult.length > 0) {
      if (userSelectResult[0].qr_activated) {
        return res.status(200).json({
          status: 200,
          message: "유효한 QR코드입니다. 해당 유저의 유저 식별자 입니다.",
          data: {
            user_id: id,
          },
        });
      } else {
        return res.status(400).json({
          status: 400,
          message: "유저가 인증대기 상태가 아닙니다.",
          data: {
            //user_id: id,
          },
        });
      }
    } else {
      return res.status(400).json({
        status: 400,
        message: "존재하지 않는 유저 식별자",
        data: {
          // user_id: id,
          // qr_validation: false,
        },
      });
    }
  } catch (err) {
    return res.status(500).json({
      status: 500,
      message: "요청을 처리하는 중에 애러가 발생했습니다.",
      data: {},
    });
  }
});

// 가게 코드 인증 및 하이볼 정보 제공
router.post("/auth/verify", async (req, res) => {
  const body = req.body;
  try {
    const [restaurantSelectResult] = await conn.execute(
      "SELECT restaurant_id, name FROM restaurant_info WHERE validation_code = ?",
      [body.validation_code]
    );
    if (restaurantSelectResult.length > 0) {
      const restaurant_id = restaurantSelectResult[0].restaurant_id;
      const [highballQueryResult] = await conn.execute(
        "SELECT highball_id, name FROM highball_info WHERE restaurant_id = ?",
        [restaurant_id]
      );
      // 가게 인증용 토큰 또는 코드 생성: body.usr_id, restaurantSelectResult[0].restaurant_id
      return res.status(200).json({
        status: 200,
        message: "가게 인증 성공",
        data: {
          user_id: body.user_id,
          restaurant_info: restaurantSelectResult[0],
          highballs: highballQueryResult,
        },
      });
    } else {
      return res.status(400).json({
        status: 400,
        message: "가게 인증 코드가 유효하지 않습니다.",
        data: {
          //user_id: body.user_id,
        },
      });
    }
  } catch (err) {
    return res.status(500).json({
      status: 500,
      message: "요청을 처리하는 중에 애러가 발생했습니다.",
      data: {},
    });
  }
});

// 서비스 이용 완료
router.post("/confirm/update", async (req, res) => {
  const body = req.body;

  // Define the required fields for the request
  const requiredFields = ["user_id", "restaurant_id", "highball_id"];

  // Filter out the missing fields from the request body
  const invalidFields = requiredFields.filter((field) => !body[field]);

  // Check if there are any missing required fields
  if (invalidFields.length > 0) {
    return res.status(400).json({
      status: 400,
      message: `The following values were not entered: ${invalidFields.join(
        ", "
      )}`,
      data: {},
    });
  }

  try {
    // 유저 서비스 이용 상태 업데이트
    await conn.execute(
      "UPDATE user_profile SET available = false, qr_activated = false WHERE id = ?",
      [body.user_id]
    );

    // 사용 기록 추가
    const currentTime = new Date();
    await conn.execute(
      "INSERT INTO usage_history (id, restaurant_id, highball_id, time) VALUES (?, ?, ?, NOW())",
      [body.user_id, body.restaurant_id, body.highball_id]
    );

    return res.status(200).json({
      status: 200,
      message: "서비스 이용 내역이 정상적으로 저장됐습니다.",
      data: {},
    });
    //
  } catch (err) {
    return res.status(500).json({
      status: 500,
      message: "요청을 처리하는 중에 애러가 발생했습니다.",
      data: {},
    });
  }
});

// 매일 정오(12시)에 함수 실행
cron.schedule("0 12 * * *", async () => {
  try {
    // 구독한 유저들의 서비스 이용상태 초기화
    const [updateResult] = await conn.execute(
      "UPDATE user_profile SET available = true WHERE subscribed = true"
    );

    const currentTime = new Date();
    console.log(
      `[${currentTime}] ${updateResult.affectedRows}개의 레코드 업데이트 완료`
    );
  } catch (err) {
    console.error("available 필드 업데이트 중 오류 발생:", err);
  }
});

export default router;
