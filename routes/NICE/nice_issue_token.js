import axios from "axios";

const url = 'https://svc.niceapi.co.kr:22001/digital/niceid/oauth/oauth/token';
const headers = {
  "Content-Type": "application/x-www-form-urlencoded",
  Authorization: "Basic ZjY1NTdlMjktZWQzMS00Mzc1LWE5Y2QtM2Q0OGY4Yzg4MTFhOmU5ZTgxYzI2ZGM1ODMxMWE4MzE3ZGVlODNkZWNiMjgz"
};

const data = new URLSearchParams();
data.append("grant_type", "client_credentials");
data.append("scope", "default");
axios.post(url, data, { headers })
.then((response) => {
    const responseData = response.data;
    
    const result_code = responseData.dataHeader.GW_RSLT_CD
    const result_message = responseData.dataHeader.GW_RSLT_MSG
    const transaction_id = responseData.dataHeader.TRAN_ID
    
    const access_token = responseData.dataBody.access_token;
    const token_type = responseData.dataBody.token_type;
    const expires_in = responseData.dataBody.expires_in;
    const scope = responseData.dataBody.scope;

    console.log("Result Code:", result_code);
    console.log("Result Message:", result_message);
    console.log("Transaction ID:", transaction_id);

    console.log("Access Token:", access_token);
    console.log("Token Type:", token_type);
    console.log("Expires In:", expires_in);
    console.log("Scope:", scope);
  })
  .catch((error) => {
    console.error("Error:", error.message);
  });
