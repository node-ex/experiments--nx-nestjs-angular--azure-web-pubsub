import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { WebPubsubModule } from '../web-pubsub/web-pubsub.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      // No need to import in other modules
      isGlobal: true,
      expandVariables: true,
      // cache: true,
    }),
    WebPubsubModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
