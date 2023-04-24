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

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private webUntis: WebuntisApiService) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      tap({
        // Succeeds when there is a response; ignore other events
        next: (event) => {
          if (event instanceof HttpResponse && event.status == 301) {
            this.webUntis.logout().subscribe();
          }
        },
        // Operation failed; error is an HttpErrorResponse
        error: (error: HttpErrorResponse) => {
          console.log(error)
          this.webUntis.logout().subscribe();
        },
      })
    );
  }
}
