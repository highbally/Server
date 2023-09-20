import crypto from 'crypto';

// 무작위 바이트 생성
const randomBytes = crypto.randomBytes(32); // 256비트 (32바이트) 생성

// 바이트를 16진수 문자열로 변환하여 비밀 키 생성
const secretKey = randomBytes.toString('hex');

console.log('안전한 비밀 키:', secretKey);