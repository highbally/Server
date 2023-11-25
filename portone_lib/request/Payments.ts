const _ = require('lodash');
const RequestBase = require('./index');
const { PaymentResponse, PaymentAmountResponse } = require('../response');
const { Status, Sorting } = require('../enum');

import { ImpUidParams } from '../../';

const StatusType = Status.getType();
const SortingType = Sorting.getType();
interface ImpUidsParams {
  imp_uid: string[],
};
interface MerchantUidsParams {
  merchant_uid: string,
  status: typeof StatusType,
  sorting: typeof Sorting,
  page: number,
};
interface StatusParams {
  status: typeof StatusType,
  page: number,
  limit: number,
  from: number,
  to: number,
  sorting: typeof SortingType,
};
interface MerchantUidParams {
  merchant_uid: string,
  status: typeof StatusType,
  sorting: typeof SortingType,
};
interface CancelData {
  imp_uid: string,
  merchant_uid: string,
  amount: number,
  tax_free: number,
  checksum: number,
  reason: string,
  refund_holder: string,
  refund_bank: string,
  refund_account: string,
};

/* 일반결제 */
class Payments extends RequestBase {
  constructor() {
    super();

    this.responseClass = new PaymentResponse();
  }

  /* 결제내역 조회 > 아임포트 번호 */
  public static getByImpUids(params: ImpUidsParams): Payments {
    const payments = new Payments();
    payments.url = '/payments';
    payments.params = params;
    payments.responseType = 'list';
    payments.keepGoing = true;
    return payments;
  }

  /* 결제내역 조회 > 주문 번호 */
  public static getByMerchantUids(params: MerchantUidsParams): Payments {
    const { merchant_uid, status, page, sorting } = params;

    const payments = new Payments();
    payments.url = `/payments/findAll/${merchant_uid}/${status}`;
    payments.params = { page, sorting };
    payments.responseType = 'collection';
    return payments;
  }

  /* 결제내역 조회 > 결제 상태 */
  public static getByStatus(params: StatusParams): Payments {
    const { status } = params;

    const payments = new Payments();
    payments.url = `/payments/status/${status}`;
    payments.params = _.omit(params, 'status');
    payments.responseType = 'collection';
    return payments;
  }

  /* 결제정보 조회 > 아임포트 번호 */
  public static getByImpUid({ imp_uid }: ImpUidParams): Payments {
    const payments = new Payments();
    payments.url = `/payments/${imp_uid}`;
    return payments;
  }

  /* 결제정보 조회 > 주문 번호 */
  public static getByMerchantUid(params: MerchantUidParams): Payments {
    const { merchant_uid, status, sorting } = params;

    const payments = new Payments();
    payments.url = `/payments/find/${merchant_uid}/${status}`;
    payments.params = { sorting };
    return payments;
  }

  /* 결제금액 조회 > 아임포트 번호 */
  public static getAmountByImpUid({ imp_uid }: ImpUidParams): Payments {
    const payments = new Payments();
    payments.url = `/payments/${imp_uid}/balance`;
    payments.responseClass = new PaymentAmountResponse();
    return payments;
  }

  /* 결제취소 */
  public static cancel(data: CancelData): Payments {
    const payments = new Payments();
    payments.url = '/payments/cancel';
    payments.method = 'POST';
    payments.data = data;
    return payments;
  }

  public async getFailedData(response: any): Promise<any> {
    const { imp_uid } = this.params;
    const succeed = response.map((payment: any) => payment.imp_uid);
    return _.difference(imp_uid, succeed);
  }
}

export {};
module.exports = Payments;
