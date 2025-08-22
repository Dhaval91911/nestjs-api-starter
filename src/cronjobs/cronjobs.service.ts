import { Injectable } from '@nestjs/common';
import { Cron, CronExpression, Interval, Timeout } from '@nestjs/schedule';

@Injectable()
export class CronjobsService {
  @Cron('* * * * *')
  handleDailyTask() {
    console.log('Running daily job');
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  handleEveryThirtySeconds() {
    console.log('Running every 30 seconds');
  }

  @Interval(10 * 60 * 1000)
  cleanTempFiles() {
    console.log('Running every 10 minutes');
  }

  @Timeout(5000)
  warmUpCache() {
    console.log('Running once, 5 s after app start');
  }
}
