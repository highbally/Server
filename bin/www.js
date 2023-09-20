import app from '../app.js';
import https from 'https';  // https 모듈 추가
import fs from 'fs';        // 파일 시스템 모듈 추가
import { createRequire } from  'module'


const  require = createRequire(import.meta.url);
const debug = require('debug')('project:server');


// 포트 설정(app.set()으로 express 어플리케이션 설정 지정)
const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

// HTTPS 옵션: 인증서와 개인 키 파일 경로 지정
const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/www.highbally.com/privkey.pem'),         // 개인 키 파일 경로
  cert: fs.readFileSync('/etc/letsencrypt/live/www.highbally.com/fullchain.pem')          // 인증서 파일 경로
};

// HTTPs 서버 생성
const server = https.createServer(options, app);

// server.listen: 서버가 수신 대기할 포트 지정 / server.on: 콜백 함수 정의
server.listen(port, () => {
  console.log(`${port}에서 응답 대기중!`);
});
server.on('error', onError);
server.on('listening', onListening);

// 입력값을 유효한 포트 번호로 변환
function normalizePort(val) {
  var port = parseInt(val, 10);

  // named pipe
  if (isNaN(port))
    return val;

  // port number
  if (port >= 0)
    return port;

  return false;
}

// "error" 이벤트 발생 확인하는 리스너
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

// "listening" 이벤트 확인하는 리스너: 서버가 듣고 있는 주소 및 포트 로그에 출력
function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}