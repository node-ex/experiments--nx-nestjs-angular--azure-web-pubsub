import { HttpClient } from '@angular/common/http';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { WebPubSubClient } from '@azure/web-pubsub-client';
import { firstValueFrom } from 'rxjs';

@Component({
  standalone: true,
  imports: [RouterModule, CommonModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'app-angular-1';
  client!: WebPubSubClient;
  logs = '';
  reconnectInterval: ReturnType<typeof setInterval> | null = null;
  reconnectTimeInMs = 60000; // 1 minute
  visibilityChangeListener!: () => void;

  constructor(private http: HttpClient) {
    console.log('PUBLIC_GREETING', process.env['PUBLIC_GREETING']);
    this.logs += `${new Date().toISOString()}: PUBLIC_GREETING ${
      process.env['PUBLIC_GREETING'] ?? ''
    }\n`;
  }

  async ngOnInit() {
    const response$ = this.http.get<{ url: string }>(
      '/api/web-pubsub/token/my-user',
    );
    const response = await firstValueFrom(response$);
    console.log('Token response:', response);
    this.logs += `${new Date().toISOString()}: Token response received\n`;

    // https://learn.microsoft.com/en-us/azure/azure-web-pubsub/reference-client-sdk-javascript#2-connect-with-your-web-pubsub-resource
    this.client = new WebPubSubClient(response.url);
    await this.client.start();

    // Set up reconnection interval
    this.setupReconnectInterval();

    // https://learn.microsoft.com/en-us/azure/azure-web-pubsub/reference-client-sdk-javascript#handle-connected-disconnected-and-stopped-events
    this.client.on('connected', (event: unknown) => {
      console.log('Connected', event);
      this.logs += `${new Date().toISOString()}: Connected ${JSON.stringify(
        event ?? {},
      )}\n`;
    });

    this.client.on('disconnected', (event: unknown) => {
      console.log('Disconnected', event);
      this.logs += `${new Date().toISOString()}: Disconnected ${JSON.stringify(
        event ?? {},
      )}\n`;
    });

    this.client.on('stopped', (event: unknown) => {
      console.log('Stopped', event);
      this.logs += `${new Date().toISOString()}: Stopped ${JSON.stringify(
        event ?? {},
      )}\n`;
    });

    // https://learn.microsoft.com/en-us/azure/azure-web-pubsub/reference-client-sdk-javascript#a-client-consumes-messages-from-the-application-server-or-joined-groups
    this.client.on('server-message', (message: unknown) => {
      console.log('Server message', message);
      // Safely access potential message data with type checking
      const messageData =
        typeof message === 'object' &&
        message !== null &&
        'message' in message &&
        typeof message.message === 'object' &&
        message.message !== null &&
        'data' in message.message
          ? String(message.message.data)
          : '';
      this.logs += `${new Date().toISOString()}: Server message ${messageData}\n`;
    });

    // Set up visibility change listener for reconnection when tab becomes visible
    this.visibilityChangeListener = () => {
      if (document.visibilityState === 'visible') {
        console.log('Document became visible, triggering reconnection');
        this.logs += `${new Date().toISOString()}: Document became visible, triggering reconnection\n`;
        void this.reconnectClient();
      }
    };

    document.addEventListener(
      'visibilitychange',
      this.visibilityChangeListener,
    );
  }

  ngOnDestroy() {
    // Clear the interval when component is destroyed
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
    }

    // Remove visibility change listener
    document.removeEventListener(
      'visibilitychange',
      this.visibilityChangeListener,
    );

    // Ensure client is stopped when component is destroyed
    this.client.stop();
  }

  setupReconnectInterval(): void {
    // Clear any existing interval
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
    }

    // Set up new interval to disconnect and reconnect every minute
    this.reconnectInterval = setInterval(() => {
      void this.reconnectClient();
    }, this.reconnectTimeInMs);

    const seconds = Math.floor(this.reconnectTimeInMs / 1000);
    this.logs += `${new Date().toISOString()}: Reconnection interval set to ${String(
      seconds,
    )} seconds\n`;
    console.log('Reconnection interval set to ' + String(seconds) + ' seconds');
  }

  /**
   * Handles the client reconnection process
   */
  private async reconnectClient(): Promise<void> {
    try {
      this.logs += `${new Date().toISOString()}: Scheduled reconnection started\n`;
      console.log('Scheduled reconnection started');

      // Stop the client
      this.client.stop();

      // Wait a short time before reconnecting
      await new Promise<void>((resolve) => setTimeout(resolve, 2000));

      // Start the client again
      await this.client.start();

      this.logs += `${new Date().toISOString()}: Scheduled reconnection completed\n`;
      console.log('Scheduled reconnection completed');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logs += `${new Date().toISOString()}: Reconnection error: ${errorMessage}\n`;
      console.error('Reconnection error:', error);
    }
  }
}
