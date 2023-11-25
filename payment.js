import express from "express";
import sqlCon from "./db/sqlCon.js";
import jwt from "jsonwebtoken";

const router = express.Router();
const conn = sqlCon();

// 아임포트 REST API 호출에 필요한 모듈 import
import { Iamport, Request, Enum } from 'iamport-rest-client-nodejs';
const { Banks } = Request;
const { BankCodeEnum } = Enum;

// 아임포트 객체 생성
const iamport = new Iamport({
  apiKey: '8431286450122238', 
  apiSecret: 'OsZS11kjpDJuj2LJ6WQxJtcIbyS82wgcudQvqPCPT5ojY8mdBGUDndZUxxhiIgVeIUfnKhXl3YO50v2V',
});

// 모든 은행 정보 조회
const getBanks = Banks.getBanks();
getBanks.request(iamport)
.then(response => console.log('response: ', response.data))
.catch(error => console.log('error: ', error.response.data));

// 특정 은행 정보 조회
const getBank = Banks.getBank({
  code: BankCodeEnum.SC,
});
await getBank.request(iamport)
.then(response => console.log('response: ', response.data))
.catch(error => console.log('error: ', error.response.data));

const {Customers} = Request;
const postBillingKey = Customers.postBillingKey({
    customer_uid: 'cuid_1_1566960465326',
    card_number: '1234-1234-1234-1234',
    expiry: '2011-11-11',
    birth: 111111,
    pwd_2digit: 11
  });
  await postBillingKey.request(iamport)
  .then(response => console.log('response: ', response.data.code))
  .catch(error => console.log('error: ', error.response.data));


import axios from 'axios';
axios({
    url: "https://api.iamport.kr/users/getToken",
    // POST method
    method: "post", 
    // "Content-Type": "application/json"
    headers: { "Content-Type": "application/json" }, 
    data: {
        // REST API키
        imp_key: "8431286450122238", 
        // REST API Secret
        imp_secret: "OsZS11kjpDJuj2LJ6WQxJtcIbyS82wgcudQvqPCPT5ojY8mdBGUDndZUxxhiIgVeIUfnKhXl3YO50v2V" 
    }
}).then(response => {
    console.log('Response:', response.data);
    axios({
        url: "https://api.iamport.kr/payments/imp_448280090638",
        method: "get", // GET method
        headers: {
          // "Content-Type": "application/json"
          "Content-Type": "application/json", 
          // 발행된 액세스 토큰
          "Authorization": `Bearer ${response.data.response.access_token}` 
        }
      }).then(response => {
        console.log('Response:', response.data);
    }).catch(error => {
        console.error('Error:', error);
    });
}).catch(error => {
    console.error('Error:', error);
});