import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { OcrService } from './ocr.service';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, OcrService],
  exports: [DocumentsService, OcrService],
})
export class DocumentsModule {}
