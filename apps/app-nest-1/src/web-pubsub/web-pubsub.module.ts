import { Module } from '@nestjs/common';
import { WebPubsubController } from './web-pubsub.controller';

@Module({
  imports: [],
  controllers: [WebPubsubController],
})
export class WebPubsubModule {}
