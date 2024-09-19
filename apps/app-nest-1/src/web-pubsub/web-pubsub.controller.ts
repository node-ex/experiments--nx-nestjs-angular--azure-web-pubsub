import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ClientTokenResponse, WebPubSubServiceClient } from '@azure/web-pubsub';

@Controller('web-pubsub')
export class WebPubsubController {
  private readonly webPubSubServiceClient: WebPubSubServiceClient;

  constructor() {
    const connectionString = process.env['AZURE_WEB_PUBSUB_CONNECTION_STRING'];
    if (!connectionString) {
      throw new Error('No connection string found');
    }

    this.webPubSubServiceClient = new WebPubSubServiceClient(
      connectionString,
      'message',
    );
  }

  @Get('token/:userId')
  getClientToken(
    @Param('userId') userId: string,
  ): Promise<ClientTokenResponse> {
    return this.getClientTokenResponse(userId);
  }

  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendMessage(): Promise<void> {
    await this.sendMessageToHub('Hello from server');
  }

  private async getClientTokenResponse(
    userId: string,
  ): Promise<ClientTokenResponse> {
    return this.webPubSubServiceClient.getClientAccessToken({
      userId,
    });
  }

  private async sendMessageToHub(message: string): Promise<void> {
    await this.webPubSubServiceClient.sendToAll(message);
    console.log('Message sent');
  }
}
