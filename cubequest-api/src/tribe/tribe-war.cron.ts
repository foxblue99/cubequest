import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TribeWarService } from './tribe-war.service';

@Injectable()
export class TribeWarCron {
  private readonly logger = new Logger(TribeWarCron.name);
  constructor(private tribeWar: TribeWarService) {}

  @Cron('0 0 * * 1', { timeZone: 'Asia/Shanghai' })
  async handleWeeklySettlement() {
    this.logger.log('开始自动结算战队周积分...');
    try {
      const result = await this.tribeWar.settleWeek();
      this.logger.log(`结算完成，共 ${result.standings.length} 支战队`);
    } catch (err) {
      this.logger.error('战队结算失败', err);
    }
  }
}
