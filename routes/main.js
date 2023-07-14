import express from "express";
import sqlCon from "../db/sqlCon.js";
import verifyToken from "../middlewares/accessControl.js";
const conn = sqlCon();
const router = express.Router();

//지도API의 마커들의 위도와 경도
router.get("/map", verifyToken, async (req, res, next) => {
  try {
    const queryResult = await conn.execute(
      "SELECT restaurant_id, latitude, longitude FROM markers"
    );
    // const markers = queryResult[0];

    // // Extract latitude and longitude values from the markers array
    // const coordinates = markers.map((marker) => ({
    //   latitude: marker.latitude,
    //   longitude: marker.longitude,
    // }));

    return res.status(200).json({
      status: 200,
      message: "제휴 업체 id, 위도, 경도 입니다",
      //coordinates: coordinates,
      qr: queryResult[0],
    });
  } catch (err) {
    console.log(err);
    return res.status(406).json({
      error: "Not Acceptable",
      message: "Invalid member information.",
    });
  }
});

router.get("/map/:restaurantId", verifyToken, async (req, res, next) => {
  try {
    const { restaurantId } = req.params;

    // Retrieve the restaurant information from restaurant_info table
    const restaurantQueryResult = await conn.execute(
      "SELECT name, opening, closing, picture, number FROM restaurant_info WHERE restaurant_id = ?",
      [restaurantId]
    );

    // Retrieve the highball names from highball_info table
    const highballQueryResult = await conn.execute(
      "SELECT name FROM highball_info WHERE restaurant_id = ? AND representation = 1",
      [restaurantId]
    );
    const highballNames = highballQueryResult[0].map((row) => row.name);

    return res.status(200).json({
      status: 200,
      message: "Marker details",
      restaurant: restaurantQueryResult[0][0],
      highballNames:
        highballNames.length > 0
          ? highballNames
          : ["No highball available for this restaurant."],
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to retrieve marker details.",
    });
  }
});

router.get("/list", verifyToken, async (req, res, next) => {
  try {
    const queryResult = await conn.execute(`
        SELECT ri.restaurant_id, ri.name, ri.opening, ri.closing, ri.picture, ri.number,
               GROUP_CONCAT(hi.name) AS representative_menus
        FROM restaurant_info ri
        LEFT JOIN highball_info hi ON ri.restaurant_id = hi.restaurant_id
        WHERE ri.restaurant_id >= 1
        GROUP BY ri.restaurant_id
      `);

    return res.status(200).json({
      status: 200,
      message: "제휴 업체 리스트입니다",
      qr: queryResult[0],
    });
  } catch (err) {
    console.log(err);
    return res.status(406).json({
      error: "Not Acceptable",
      message: "Invalid member information.",
    });
  }
});

router.get("/detail/:restaurantId", verifyToken, async (req, res, next) => {
  const { restaurantId } = req.params;
  try {
    const menuQueryResult = await conn.execute(
      "SELECT name, price, picture, description FROM menu_info WHERE restaurant_id = ?",
      [restaurantId]
    );
    const menulistQueryResult = await conn.execute(
      "SELECT menulist FROM menu_list WHERE restaurant_id = ?",
      [restaurantId]
    );

    return res.status(200).json({
      status: 200,
      message: "This is business information.",
      menu: menuQueryResult[0],
      menulist: menulistQueryResult[0],
    });
  } catch (err) {
    console.log(err);
    return res.status(406).json({
      error: "Not Acceptable",
      message: "Invalid member information.",
    });
  }
});

export default router;
