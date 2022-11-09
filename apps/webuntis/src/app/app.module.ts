import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { LoginComponent } from './login/login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatTableModule } from '@angular/material/table';
import { GradesComponent } from './grades/grades.component';
import { RouterModule } from '@angular/router';
import { AuthGuard } from './auth.guard';

@NgModule({
  declarations: [AppComponent, LoginComponent, GradesComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatTableModule,
    RouterModule.forRoot([
    {path: 'grades', component: GradesComponent, canActivate: [AuthGuard]},
    {path: 'login', component: LoginComponent},
    {path: '**', component: LoginComponent},
  ]),
  ],
  providers: [CookieService],
  bootstrap: [AppComponent],
})
export class AppModule {}
