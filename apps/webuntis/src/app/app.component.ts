import { Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { WebuntisService } from './webuntis/webuntis.service';
import { LoadingService } from './loading/loading.service'

@Component({
  selector: 'webuntis-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {

  contentIsLoading = true

  constructor(private webUntis: WebuntisService, private router: Router, private activatedRoute: ActivatedRoute, private loading: LoadingService) {
    this.loading.isLoading$.subscribe(isLoading => this.contentIsLoading = isLoading)
  }

  logout() {
    this.webUntis.logout(this.router).subscribe()
  }

  isLoggedIn(): boolean {
    return this.webUntis.isLoggedIn()
  }

  backExists(): boolean {
    return this.activatedRoute.firstChild?.snapshot.routeConfig?.path === 'subject' ? true : false
  }

  back() {
    this.router.navigate(['grades'])
  }

  backToHome() {
    this.router.navigate([''])
  }
}
