import express from "express";
import sqlCon from "../db/sqlCon.js";
import verifyToken from "../middlewares/accessControl.js";
import jwt from "jsonwebtoken";
const conn = sqlCon();
const router = express.Router();

router.post("/scode", verifyToken, async(req,res) => {
    const inputCode = req.body.scode;
    const user = req.decoded.id;
    try {
        const [[queryResult]] = await conn.execute(
            "SELECT scode FROM scodes WHERE scode = ?",
            [inputCode]
        );
        console.log(queryResult);
        if(queryResult) {
            const queryScode = queryResult.scode
            await conn.execute(
                "UPDATE user_profile SET available = true, subscribed = true, expired = DATE_ADD(NOW(), INTERVAL 1 MONTH) WHERE usr_id = ?",
                [user]
            );            
            await conn.execute("DELETE FROM scodes WHERE scode = ?", [queryScode])
            res.status(200).json({
                status:200,
                message: "유효한 구독 확인 코드입니다. 구독 확인됐습니다.",
                data:[]
            })
        } else {
            res.status(401).json({
                status: 401,
                message: "유효하지 않은 구독 확인 코드입니다.",
                data: []
            });
        }
        
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            status: 500,
            message: "요청을 처리하는 중에 애러가 발생했습니다.",
            data: [],
        });
    }
});

router.get("/cancel", verifyToken, async (req, res) => {
    try {
        const user = req.decoded.id;
        console.log(user);
        
        const [expiredQueryResult] = await conn.execute("SELECT id, expired FROM user_profile WHERE usr_id = ?", [user]);
        console.log(expiredQueryResult[0].id);
        const [usageQueryResult] = await conn.execute("SELECT * FROM usage_history WHERE usage_id = (SELECT MAX(usage_id) FROM usage_history WHERE id = ?);", [expiredQueryResult[0].id]);
        console.log(usageQueryResult);
        console.log(usageQueryResult.length == 0);
        if (usageQueryResult.length==0) {
            return res.status(200).json({
                status: 200,
                message: "구독 취소가 가능합니다.",
                data: []
            });
        }
        
        const recentUsageDate = new Date(usageQueryResult[0].time);
        console.log(recentUsageDate)
        const oneMonthBeforeExpired = new Date(expiredQueryResult[0].expired);
        console.log(oneMonthBeforeExpired);
        oneMonthBeforeExpired.setMonth(oneMonthBeforeExpired.getMonth() - 1);
        
        console.log(oneMonthBeforeExpired);
        
        if (recentUsageDate >= oneMonthBeforeExpired && usageQueryResult.length!=0 ) {
            return res.status(401).json({
                status: 401,
                message: "구독 취소가 불가능합니다.",
                data: []
            });
        } else {
            return res.status(200).json({
                status: 200,
                message: "구독 취소가 가능합니다.",
                data: []
            });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            status: 500,
            message: "요청을 처리하는 중에 애러가 발생했습니다.",
            data: [],
        });
    }
});

export default router;