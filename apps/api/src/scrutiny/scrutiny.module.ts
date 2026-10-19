import { Module } from '@nestjs/common';
import { ScrutinyService } from './scrutiny.service';
import { ScrutinyController } from './scrutiny.controller';

@Module({
  controllers: [ScrutinyController],
  providers: [ScrutinyService],
  exports: [ScrutinyService],
})
export class ScrutinyModule {}
