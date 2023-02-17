import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { LoginComponent } from './login/login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { GradesComponent } from './grades/grades.component';
import { RouterModule } from '@angular/router';
import { AuthGuard } from './guard/auth.guard';
import { JwtModule } from '@auth0/angular-jwt';

import { HttpInterceptorProviders } from './auth/index';
import { ColorMarkPipe } from './pipes/color-mark.pipe';
import { SubjectComponent } from './subject/subject.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';

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
        allowedDomains: ['messe.webuntis.com'],
        // disallowedRoutes: ["http://example.com/examplebadroute/"],
      },
    }),
    ReactiveFormsModule,
    MatExpansionModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    NgxChartsModule,
    MatTableModule,
    MatCardModule,
    RouterModule.forRoot([
      { path: 'grades', component: GradesComponent, canActivate: [AuthGuard] },
      { path: 'subject', component: SubjectComponent, canActivate: [AuthGuard] },
      { path: 'login', component: LoginComponent },
      { path: '**', component: LoginComponent },
    ]),
  ],
  providers: [CookieService, HttpInterceptorProviders],
  bootstrap: [AppComponent],
})
export class AppModule {}
