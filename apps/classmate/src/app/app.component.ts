import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WebuntisApiService } from './webuntis/webuntisApi.service';
import { LoadingService } from './loading/loading.service';

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
    this.webUntis.logout(this.router).subscribe();
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
}
