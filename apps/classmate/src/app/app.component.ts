import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WebuntisApiService } from './webuntis/webuntisApi.service';
import { LoadingService } from './loading/loading.service';
import { Person } from '@classmate/api-interfaces';

@Component({
  selector: 'classmate-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(
    private webUntis: WebuntisApiService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    protected loading: LoadingService
  ) {
  }

  logout() {
    this.loading.setLoading(true)
    this.webUntis.logout().subscribe();
  }

  isLoggedIn(): boolean {
    return this.webUntis.isLoggedIn();
  }

  backExists(): boolean {
    return this.activatedRoute.firstChild?.snapshot.routeConfig?.path ===
      'subject'
      ? true
      : false;
  }

  back() {
    this.router.navigate(['grades']);
  }

  backToHome() {
    this.router.navigate(['']);
  }

  getUser(): Person | null {
    if (this.webUntis.isLoggedIn()) {
      return this.webUntis.student;
    }
    else {
      this.webUntis.logout()
      return null;
    }
  }
}