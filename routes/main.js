import express from "express";
import sqlCon from "../db/sqlCon.js";
import verifyToken from "../middlewares/accessControl.js";
const conn = sqlCon();
const router = express.Router();

//메인화면의 지도에서 지도API의 마커들의 위도와 경도
router.get("/markers", async (req, res, next) => {
  try {
    const queryResult = await conn.execute(
      "SELECT restaurant_id, latitude, longitude FROM markers"
    );
    console.log(queryResult);
    return res.status(200).json({
      status: 200,
      message: "제휴 업체 id, 위도, 경도 입니다.",
      data: queryResult[0],
    });
  } catch (err) {
    return res.status(500).json({
      status: 500,
      message: "요청을 처리하는 중에 애러가 발생했습니다.",
      data: {},
    });
  }
});

//지도에서 특정 마커를 눌렀을 때
router.get("/marker", async (req, res, next) => {
  try {
    //?key=value와 같이 쿼리로 request보낸거.
    const { restaurantId } = req.query;

    const [[restaurantQueryResult]] = await conn.execute(
      "SELECT restaurant_id, name, opening, closing, picture, number FROM restaurant_info WHERE restaurant_id = ?",
      [restaurantId]
    );

    const highballQueryResult = await conn.execute(
      "SELECT name FROM highball_info WHERE restaurant_id = ? AND available = 1",
      [restaurantId]
    );
    console.log(highballQueryResult);
    //highballQueryResult[0]이게 쿼리 결과의 결과 행 array임.
    //(row) => row.name에서 name값을 추출하여 반환하는 화살표 함수이고 map()이 추출된 name의 값들을 묶어 새 배열로 반환했다.
    const highballNames = highballQueryResult[0].map((row) => row.name);

    console.log(restaurantQueryResult);
    //console.log(highballNames);

    return res.status(200).json({
      status: 200,
      message: "Marker details",
      data: {
        ...restaurantQueryResult,
        available_highball:
          highballNames.length > 0
            ? highballNames
            : ["서비스 이용 가능한 하이볼이 없습니다."],
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 500,
      message: "요청을 처리하는 중에 애러가 발생했습니다.",
      data: {},
    });
  }
});

//메인화면의 리스트에서 업체 간략 정보들의 리스트
router.get("/list", async (req, res, next) => {
  try {
    const queryResult = await conn.execute(`
    SELECT ri.restaurant_id, ri.name, ri.opening, ri.closing, ri.picture, ri.number, GROUP_CONCAT(hi.name) AS available_highball 
    FROM restaurant_info ri LEFT JOIN highball_info hi ON ri.restaurant_id = hi.restaurant_id AND hi.available = 1 
    WHERE ri.restaurant_id >= 1 GROUP BY ri.restaurant_id
      `);

    return res.status(200).json({
      status: 200,
      message: "제휴 업체 리스트입니다",
      data: queryResult[0],
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 500,
      message: "요청을 처리하는 중에 애러가 발생했습니다.",
      data: {},
    });
  }
});

//마커를 눌렀을 때 뜨는 가게 간략 정보나 리스트에서 특정 가게를 눌렀을 때 가게 상세 페이지를 위한 정보
router.get("/detail", async (req, res, next) => {
  const { restaurantId } = req.query;
  try {
    const restaurantQueryResult = await conn.execute(
      "SELECT restaurant_id, name, opening, closing, picture, number FROM restaurant_info WHERE restaurant_id = ?",
      [restaurantId]
    );
    const menuQueryResult = await conn.execute(
      "SELECT name, price, picture, description FROM menu_info WHERE restaurant_id = ?",
      [restaurantId]
    );
    const highballQueryResult = await conn.execute(
      "SELECT name, price, picture, description FROM highball_info WHERE restaurant_id = ?",
      [restaurantId]
    );
    const menulistQueryResult = await conn.execute(
      "SELECT menulist FROM menu_list WHERE restaurant_id = ?",
      [restaurantId]
    );
    const menuList = menulistQueryResult[0].map((rows) => rows.menulist);

    const responseData = {
      restaurant: restaurantQueryResult[0][0],
      menu: [...menuQueryResult[0], ...highballQueryResult[0]],
      menulist: menuList,
    };

    return res.status(200).json({
      status: 200,
      message: "해당 업체 상세 정보입니다.",
      data: responseData,
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
