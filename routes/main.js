import express from "express";
import sqlCon from "../db/sqlCon.js";
import verifyRenew from "../middlewares/accessRenew.js";
const conn = sqlCon();
const router = express.Router();

//메인화면의 지도에서 지도API의 마커들의 위도와 경도
router.get("/markers",async (req, res, next) => {
  try {
    const queryResult = await conn.execute(
      "SELECT m.restaurant_id, m.latitude, m.longitude, o.available FROM markers m JOIN open o ON m.restaurant_id = o.restaurant_id"
    );
    return res.status(200).json({
      status: 200,
      message: "제휴 업체 id, 위도, 경도 입니다.",
      data: queryResult[0],
    });
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      status: 500,
      message: "요청을 처리하는 중에 애러가 발생했습니다.",
      data: [],
    });
  }
});


//지도에서 특정 마커를 눌렀을 때
router.get("/marker", async (req, res, next) => {
  try {
    //?key=value와 같이 쿼리로 request보낸거.
    const { restaurantId } = req.query;
    const [[QueryResult]] = await conn.execute(
      "SELECT ri.restaurant_id, ri.name, ri.picture, ri.number, o.* FROM restaurant_info ri LEFT JOIN open o ON ri.restaurant_id = o.restaurant_id WHERE ri.restaurant_id = ?"
      , [restaurantId]);
    const highballQueryResult = await conn.execute(
      "SELECT name FROM highball_info WHERE restaurant_id = ?",
      [restaurantId]
    );
    //highballQueryResult[0]이게 쿼리 결과의 결과 행 array임.
    //(row) => row.name에서 name값을 추출하여 반환하는 화살표 함수이고 map()이 추출된 name의 값들을 묶어 새 배열로 반환했다.
    const highballNames = highballQueryResult[0].map((row) => row.name);
    return res.status(200).json({
      status: 200,
      message: "마커 선택 시 가게 상세 정보입니다.",
      data: [
        {
          restaurant_info : QueryResult,
          available_highball:
            highballNames.length > 0
              ? highballNames.join(', ')
              : "서비스 이용 가능한 하이볼이 없습니다.",
        }
      ],
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 500,
      message: "요청을 처리하는 중에 애러가 발생했습니다.",
      data: [],
    });
  }
});

//메인화면의 리스트에서 업체 간략 정보들의 리스트
router.get("/list", async (req, res, next) => {
  try {
    const queryResult = await conn.execute(`
    SELECT 
    ri.restaurant_id, 
    ri.name, 
    ri.picture, 
    ri.number, 
    IFNULL(GROUP_CONCAT(hi.name),"서비스 이용 가능한 하이볼이 없습니다.") AS available_highball, 
    o.mon, 
    o.tue, 
    o.wed, 
    o.thu, 
    o.fri, 
    o.sat, 
    o.sun, 
    o.available
  FROM restaurant_info ri
  LEFT JOIN highball_info hi ON ri.restaurant_id = hi.restaurant_id
  LEFT JOIN open o ON ri.restaurant_id = o.restaurant_id
  WHERE ri.restaurant_id >= 1
  GROUP BY 
    ri.restaurant_id, 
    ri.name, 
    ri.picture, 
    ri.number, 
    o.mon, 
    o.tue, 
    o.wed, 
    o.thu, 
    o.fri, 
    o.sat, 
    o.sun, 
    o.available;
  
`);


    return res.status(200).json({
      status: 200,
      message: "제휴 업체 리스트입니다",
      data: [{
        restaurant_info : queryResult[0]
      }]
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 500,
      message: "요청을 처리하는 중에 애러가 발생했습니다.",
      data: [],
    });
  }
});

//마커를 눌렀을 때 뜨는 가게 간략 정보나 리스트에서 특정 가게를 눌렀을 때 가게 상세 페이지를 위한 정보
router.get("/detail", async (req, res, next) => {
  const { restaurantId } = req.query;
  try {
    const { restaurantId } = req.query;
    const [[QueryResult]] = await conn.execute(
      'SELECT ri.*, o.*, m.address FROM restaurant_info ri LEFT JOIN open o ON ri.restaurant_id = o.restaurant_id LEFT JOIN markers m ON ri.restaurant_id = m.restaurant_id WHERE ri.restaurant_id = ?',
      [restaurantId]
    );

    const [highballQueryResult] = await conn.execute(
      "SELECT name, picture FROM highball_info WHERE restaurant_id = ?",
      [restaurantId]
    );
    //highballQueryResult[0]이게 쿼리 결과의 결과 행 array임.
    //(row) => row.name에서 name값을 추출하여 반환하는 화살표 함수이고 map()이 추출된 name의 값들을 묶어 새 배열로 반환했다.
    //const highballNames = highballQueryResult[0].map((row) => row.name);

    const menulistQueryResult = await conn.execute(
      "SELECT menulist FROM menu_list WHERE restaurant_id = ?",
      [restaurantId]
    );
    const menuList = menulistQueryResult[0].map((rows) => rows.menulist);

    return res.status(200).json({
      status: 200,
      message: "해당 업체 상세 정보입니다.",
      data: [
        {
          restaurant_info : QueryResult,
          available_highball:
              highballQueryResult.length > 0
              ? highballQueryResult
              : "서비스 이용 가능한 하이볼이 없습니다.",
          menu_list : menuList
        }
      ]
  });
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      status: 500,
      message: "요청을 처리하는 중에 에러가 발생했습니다.",
      data: [],
    });
  }
});

//DB접근 못할때
// router.get('/update', async (req, res, next) => {
//   try{
//   await conn.execute("delete from open where open_id = 8");
//   console.log("done");
//   return res.status(200).json({
//     status:200,
//     message: "성공"
//   })
// }catch (err) {
//   console.log(err)
//   return res.status(400).json({
//     status:400,
//     message:"실패"
//   })
// }
// });
export default router;