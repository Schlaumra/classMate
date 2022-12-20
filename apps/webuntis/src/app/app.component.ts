import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { WebuntisService } from './webuntis.service';

@Component({
  selector: 'webuntis-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {

  constructor(private webUntis: WebuntisService, private router: Router) {}

  logout() {
    console.log("Logout")
    this.webUntis.logout().subscribe()
    this.router.navigate(['login'])
  }
}
