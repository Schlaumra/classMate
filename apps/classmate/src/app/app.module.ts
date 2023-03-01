import { DatePipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { isDevMode, NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { JwtModule } from '@auth0/angular-jwt';
import { CookieService } from 'ngx-cookie-service';
import { AppComponent } from './app.component';
import { GradesComponent } from './grades/grades.component';
import { AuthGuard } from './guard/auth.guard';
import { LoginComponent } from './login/login.component';

import { ServiceWorkerModule } from '@angular/service-worker';
import {
  HttpCacheInterceptorModule,
  useHttpCacheLocalStorage
} from '@ngneat/cashew';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { HttpInterceptorProviders } from './auth/index';
import { ColorMarkPipe } from './pipes/color-mark.pipe';
import { SubjectComponent } from './subject/subject.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    GradesComponent,
    ColorMarkPipe,
    SubjectComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: () => {
          return localStorage.getItem('apiToken');
        },
        allowedDomains: ['mese.webuntis.com'],
      },
    }),
    ReactiveFormsModule,
    MatExpansionModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatToolbarModule,
    MatSnackBarModule,
    MatTableModule,
    MatCardModule,
    NgxChartsModule,
    HttpCacheInterceptorModule.forRoot({
      ttl: 1000 * 1, // 1min // TODO: Reset to 1min
      responseSerializer(body) {
        return structuredClone(body);
      },
    }),
    RouterModule.forRoot([
      { path: 'grades', component: GradesComponent, canActivate: [AuthGuard] },
      {
        path: 'subject',
        component: SubjectComponent,
        canActivate: [AuthGuard],
      },
      { path: 'login', component: LoginComponent },
      { path: '**', component: LoginComponent },
    ]),
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
  providers: [
    CookieService,
    DatePipe,
    HttpInterceptorProviders,
    useHttpCacheLocalStorage,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
