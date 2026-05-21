import { Module } from '@nestjs/common';
import { EdgarService } from './service/edgar.service';

@Module({
  providers: [{ provide: 'EdgarService', useClass: EdgarService }],
  exports: ['EdgarService'],
})
export class EdgarModule {}
