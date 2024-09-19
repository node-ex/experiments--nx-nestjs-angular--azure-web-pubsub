import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { WebPubSubClient } from '@azure/web-pubsub-client';
import { firstValueFrom } from 'rxjs';

@Component({
  standalone: true,
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'app-angular-1';
  client!: WebPubSubClient;

  constructor(private http: HttpClient) {
    console.log('PUBLIC_GREETING', process.env['PUBLIC_GREETING']);
  }

  async ngOnInit() {
    const response$ = this.http.get<any>('/api/web-pubsub/token/my-user');
    const response = await firstValueFrom(response$);

    console.log('Token response:', response);
    this.client = new WebPubSubClient(response.url);

    await this.client.start();

    this.client.on('connected', () => {
      console.log('Connected');
    });
    this.client.on('disconnected', () => {
      console.log('Disconnected');
    });
    this.client.on('stopped', () => {
      console.log('Stopped');
    });
    this.client.on('server-message', (message: any) => {
      console.log('Server message', message);
    });
  }
}
