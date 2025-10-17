import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, Interval, Timeout } from '@nestjs/schedule';

@Injectable()
export class CronjobsService {
  private readonly logger = new Logger(CronjobsService.name);
  @Cron('* * * * *')
  handleDailyTask() {
    this.logger.log('Running daily job');
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  handleEveryThirtySeconds() {
    this.logger.log('Running every 30 seconds');
  }

  @Interval(10 * 60 * 1000)
  cleanTempFiles() {
    this.logger.log('Running every 10 minutes');
  }

  @Timeout(5000)
  warmUpCache() {
    this.logger.log('Running once, 5 s after app start');
  }
}
