function sendPostRequest() {
    const url = 'https://www.highbally.com/auth/signup/nice/issue_auth_token';
    const data = {};

    const responseData = fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(responseData => {
            // 응답을 받아서 필요한 데이터를 추출
            const token_version_id = responseData.data[0].token_version_id;
            const enc_data = responseData.data[0].enc_data;
            const integrity_value = responseData.data[0].integrity_value;

            console.log(token_version_id);
            console.log(enc_data);
            console.log(integrity_value);

            const data_ = {
                token_version_id: token_version_id,
                enc_data: enc_data,
                integrity_value: integrity_value
            }

            return data_
        })
        .catch(error => {
            console.error('오류 발생: ' + error);
        });
    
    return responseData;
}

// 페이지 로드 후 요청 보내기
const data = sendPostRequest();

export default data;