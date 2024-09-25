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
  async sendToHub(): Promise<void> {
    await this.sendMessageToHub('Hello from server');
  }

  @Post('send/:userId')
  @HttpCode(HttpStatus.OK)
  async sendToUser(@Param('userId') userId: string): Promise<void> {
    if (!userId) {
      throw new Error('userId is required');
    }

    await this.sendMessageToUser(userId, 'Hello from server');
  }

  private async getClientTokenResponse(
    userId: string,
  ): Promise<ClientTokenResponse> {
    try {
      // https://learn.microsoft.com/en-us/azure/azure-web-pubsub/reference-server-sdk-js#get-the-access-token-for-a-client-to-start-the-websocket-connection
      // https://learn.microsoft.com/en-us/rest/api/webpubsub/dataplane/web-pub-sub/generate-client-token?view=rest-webpubsub-dataplane-2024-01-01&tabs=HTTP
      return this.webPubSubServiceClient.getClientAccessToken({
        userId,
      });
    } catch (error) {
      console.error('Failed to get client token:', error);
      throw error;
    }
  }

  private async sendMessageToHub(message: string): Promise<void> {
    try {
      // https://learn.microsoft.com/en-us/azure/azure-web-pubsub/reference-server-sdk-js#broadcast-messages-to-all-connections-in-a-hub
      // https://learn.microsoft.com/en-us/rest/api/webpubsub/dataplane/web-pub-sub/send-to-all?view=rest-webpubsub-dataplane-2024-01-01&tabs=HTTP
      await this.webPubSubServiceClient.sendToAll(message);
    } catch (error) {
      console.error('Failed to send message to hub:', error);
      throw error;
    }

    console.log('Message sent to hub');
  }

  private async sendMessageToUser(
    userId: string,
    message: string,
  ): Promise<void> {
    if (!(await this.isUserConnected(userId))) {
      throw new Error(`User ${userId} is not connected`);
    }

    try {
      // https://learn.microsoft.com/en-us/azure/azure-web-pubsub/reference-server-sdk-js#send-messages-to-all-connections-for-a-user
      // https://learn.microsoft.com/en-us/rest/api/webpubsub/dataplane/web-pub-sub/send-to-user?view=rest-webpubsub-dataplane-2024-01-01&tabs=HTTP
      // NOTE: It returns success even if client with specified userId is not connected
      await this.webPubSubServiceClient.sendToUser(userId, message);
    } catch (error) {
      console.error(`Failed to send message to user with ID ${userId}`, error);
      throw error;
    }

    console.log(`Message sent to user with ID ${userId}`);
  }

  private async isUserConnected(userId: string): Promise<boolean> {
    try {
      // https://learn.microsoft.com/en-us/rest/api/webpubsub/dataplane/web-pub-sub/connection-exists?view=rest-webpubsub-dataplane-2024-01-01&tabs=HTTP
      return this.webPubSubServiceClient.userExists(userId);
    } catch (error) {
      console.error(
        `Failed to check user existence for user with ID ${userId}:`,
        error,
      );
      throw error;
    }
  }
}
