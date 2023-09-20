import axios from "axios";
import crypto from 'crypto';

const url = "https://svc.niceapi.co.kr:22001/digital/niceid/api/v1.0/common/crypto/token"
const access_token = "ac869294-911a-4b5d-a8b8-cb741abd5c64"
const client_id = "f6557e29-ed31-4375-a9cd-3d48f8c8811a"
const credentials = access_token + ":" + Math.floor(Date.now() / 1000) + ":" + client_id;
// const credentials = `${process.env.ACCESS_TOKEN}:${Math.floor(Date.now()/1000)}:${process.env.CLIENT_ID}`;
const buffer = Buffer.from(credentials, 'utf-8');
const encodedCredentials = buffer.toString('base64');
const authorization = "bearer " + encodedCredentials;

const headers = {
    "Content-Type": "application/json",
    Authorization: authorization,
    "client_id": client_id,
    "ProductID": "2101979031",
}

// 시간 생성
const time = new Date();
const year = time.getFullYear();
var month = time.getMonth() + 1;
var date = time.getDate();
var hour = time.getHours();
var minute = time.getMinutes();
var second = time.getSeconds();
var req_dtim = year
for (var i of [month, date, hour, minute, second]) {
    if (i < 10) i = "0" + i
    req_dtim += i
}

// 난수 생성
const random = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let str = '';
    for (let i = 0; i < length; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return str;
};
const req_no = random(30)

const requestData = {
    dataHeader: { "CNTY_CD": "ko" },
    dataBody: {
        req_dtim: req_dtim, // 요청일시 (YYYYMMDDHHMMSS)
        req_no: req_no, // 요청 고유번호
        enc_mode: '1',
    },
};

const data = await axios.post(url, requestData, { headers })
    .then((response) => {
        const responseData = response.data;

        const response_result_code = responseData.dataHeader.GW_RSLT_CD
        const result_message = responseData.dataHeader.GW_RSLT_MSG

        const response_code = responseData.dataBody.rsp_cd;
        const result_code = responseData.dataBody.result_cd;
        const site_code = responseData.dataBody.site_code;
        const token_version_id = responseData.dataBody.token_version_id;
        const token_val = responseData.dataBody.token_val;
        const period = responseData.dataBody.period;

        console.log('Response Result Code:', response_result_code);
        console.log('Response Result Message:', result_message);
        console.log('Response Code:', response_code);
        console.log('Result Code:', result_code);
        console.log('Site Code:', site_code);
        console.log('Token Version ID:', token_version_id);
        console.log('Token Value:', token_val);

        // 대칭키 및 무결성키 생성
        const value = req_dtim.trim() + req_no.trim() + token_val.trim();
        const hash = crypto.createHash('sha256');
        hash.update(value, 'utf-8');
        const arrHashValue = hash.digest();
        const resultVal = arrHashValue.toString('base64');
        const key = resultVal.slice(0, 16);
        const iv = resultVal.slice(-16);
        const hmac_key = resultVal.slice(0, 32);
        
        // 데이터 암호화
        const reqData = JSON.stringify({
            "requestno": req_no,
            "returnurl": "https://www.highbally.com/auth/nice/get_user_info",
            "sitecode": site_code,
            "methodtype": "post",
            "popupyn": "Y",
        });
        const cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(key), Buffer.from(iv));
        const encrypted = Buffer.concat([cipher.update(reqData, 'utf-8'), cipher.final()]);
        const enc_data = encrypted.toString('base64');
        
        // 무결성 체크값 생성
        function hmac256(secretKey, message) {
            try {
                const hmac = crypto.createHmac('sha256', secretKey);
                hmac.update(message);
                return hmac.digest();
            } catch (error) {
                throw new Error('Failed to generate HMACSHA256 encrypt');
            }
        }
        const hmacSha256 = hmac256(Buffer.from(hmac_key), Buffer.from(enc_data));
        const integrity_value = hmacSha256.toString('base64');
        
        console.log('대칭키:', key);
        console.log('Initial Vector:', iv);
        console.log('무결성키:', hmac_key);
        console.log("암호화된 데이터: ", enc_data);
        console.log("무결성 체크값: ", integrity_value);

        const data = {
            "token_version_id": token_version_id,
            "enc_data": enc_data,
            "integrity_value": integrity_value,
        }
        return data
    })
    .catch((error) => {
        console.error("Error:", error.message);
    });

export default data;