import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpResponse,
} from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { WebuntisApiService } from '../webuntis/webuntisApi.service';
import { Router } from '@angular/router';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private webUntis: WebuntisApiService, private router: Router) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      tap({
        // Succeeds when there is a response; ignore other events
        next: (event) => {
          if (event instanceof HttpResponse && event.status == 301) {
            this.webUntis.logout(this.router).subscribe();
          }
        },
        // Operation failed; error is an HttpErrorResponse
        error: (error: HttpErrorResponse) => {
          if (error.status == 0 || error.status == 401 ) {
            this.webUntis.logout(this.router).subscribe();
          }
        },
      })
    );
  }
}
