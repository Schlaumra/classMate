import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { WebuntisService } from '../webuntis/webuntis.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private webuntis: WebuntisService) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): true|UrlTree {
    if (!this.webuntis.isLoggedIn()) {
      return this.router.parseUrl('/login')
    }
    return true;
  }
}
