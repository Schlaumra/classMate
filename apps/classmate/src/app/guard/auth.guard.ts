import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { WebuntisApiService } from '../webuntis/webuntisApi.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private webuntis: WebuntisApiService) {}

  canActivate(): true | UrlTree {
    if (!this.webuntis.isLoggedIn()) {
      return this.router.parseUrl('/login');
    }
    return true;
  }
}
