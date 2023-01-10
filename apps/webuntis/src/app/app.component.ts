import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { WebuntisService } from './webuntis/webuntis.service';

@Component({
  selector: 'webuntis-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {

  constructor(private webUntis: WebuntisService, private router: Router) {}

  logout() {
    this.webUntis.logout(this.router).subscribe()
  }

  isLoggedIn(): boolean {
    return this.webUntis.isLoggedIn()
  }
}
