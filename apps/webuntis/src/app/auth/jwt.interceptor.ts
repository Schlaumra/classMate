import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { WebuntisService } from '../webuntis/webuntis.service';
import { Router } from '@angular/router';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private webUntis: WebuntisService, private router: Router) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      tap({
        // Succeeds when there is a response; ignore other events
        // next: (event) => {},
        // Operation failed; error is an HttpErrorResponse
        error: (error: HttpErrorResponse) => {
          console.log('FAILED', request, error);
          if (error.status == 0 || error.status == 401) {
            this.webUntis.logout(this.router).subscribe();
          }
        },
      })
    );
  }
}
