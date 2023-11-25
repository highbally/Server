import EnumBase from '.';

class LogisCode extends EnumBase {
  public LOGEN: string = 'LOGEN';
  public KOREX: string = 'KOREX';
  public HYUNDAI: string = 'HYUNDAI';
  public HANARO: string = 'HANARO';
  public SAGAWA: string = 'SAGAWA';
  public KGB: string = 'KGB';
  public YELLOWCAP: string = 'YELLOWCAP';
  public DONGBU: string = 'DONGBU';
  public EPOST: string = 'EPOST';
  public CJGLS: string = 'CJGLS';
  public HANJIN: string = 'HANJIN';
  public ETC: string = 'ETC';

  public getValue(key: string): string {
    if (key) {
      switch (key) {
        case 'LOGEN':
          return '로젠택배';
        case 'KOREX':
          return '대한통운';
        case 'HYUNDAI':
          return '현대택배';
        case 'HANARO':
          return '하나로택배';
        case 'SAGAWA':
          return 'SC로지스';
        case 'KGB':
          return 'KGB택배';
        case 'YELLOWCAP':
          return '옐로우캡';
        case 'DONGBU':
          return '동부택배';
        case 'EPOST':
          return '우체국택배';
        case 'CJGLS':
          return 'CJGLS';
        case 'HANJIN':
          return '한진택배';
        case 'ETC':
          return '기타(위 코드표에 해당되지 않는 값이 전달되면 ETC로 자동 처리됩니다)';
        default:
          throw new Error(`정의되지 않은 key값(${key}) 입니다.`);
      }
    }
    throw new Error('key값을 입력해주세요.');
  }
}

module.exports = new LogisCode();