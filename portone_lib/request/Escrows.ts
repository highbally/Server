const _ = require('lodash');
const RequestBase = require('./index');
const { EscrowResponse } = require('../response');
const { LogisCode } = require('../enum');

const logisCodeType = LogisCode.getType();

interface SenderAndReceiver {
  name: string,
  tel: string,
  addr: string,
  postcode: string,
};
interface Logis {
  company: typeof logisCodeType,
  invoice: string,
  sent_at: number,
};
interface Data {
  imp_uid: string,
  sender?: SenderAndReceiver,
  receiver?: SenderAndReceiver,
  logis: Logis,
};

/* 결제 예정 금액 등록 및 조회 */
class Escrows extends RequestBase {
  constructor() {
    super();

    this.responseClass = new EscrowResponse();
  }

  /* 결제 예정 금액 등록 */
  public static postEscrow(data: Data): Escrows {
    const { imp_uid } = data;
    const prepare = new Escrows();
    prepare.url = `/escrows/logis/${imp_uid}`;
    prepare.method = 'POST';
    prepare.data = _.omit(data, 'imp_uid');
    return prepare;
  }

  /* 결제 예정 금액 조회 */
  public static putEscrow(data: Data): Escrows {
    const { imp_uid } = data;
    const prepare = new Escrows();
    prepare.url = `/escrows/logis/${imp_uid}`;
    prepare.method = 'PUT';
    prepare.data = _.omit(data, 'imp_uid');
    return prepare;
  }
}

export {};
module.exports = Escrows;
