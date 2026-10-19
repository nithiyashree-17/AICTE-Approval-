import { Module } from '@nestjs/common';
import { EvcService } from './evc.service';
import { EvcController } from './evc.controller';

@Module({
  controllers: [EvcController],
  providers: [EvcService],
  exports: [EvcService],
})
export class EvcModule {}
