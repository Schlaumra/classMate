import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { WebuntisService } from '../webuntis/webuntis.service';
import { Router } from '@angular/router';
import { LoadingService } from '../loading/loading.service';
import { catchError, of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BadCredentials } from '@webuntis/api-interfaces';

@Component({
  selector: 'webuntis-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  private school = '';

  loginForm = this.formBuilder.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });
  hide = true;

  constructor(
    private webUntis: WebuntisService,
    private formBuilder: FormBuilder,
    private router: Router,
    private contentLoading: LoadingService,
    private snackBar: MatSnackBar
  ) {}
  ngOnInit(): void {
    this.school = 'lbs-brixen';
    if (this.webUntis.isLoggedIn()) {
      this.router.navigate(['grades']);
    }
    this.webUntis.logout(this.router);
    this.contentLoading.setLoading(false);
  }

  login(): void {
    const { username, password } = this.loginForm.value;
    this.contentLoading.setLoading(true);
    if (username && password) {
      this.webUntis
        .login(this.school, username, password)
        .pipe(
          catchError((error) => {
            console.log('Error: ', error);
            this.contentLoading.setLoading(false);
            if (error instanceof BadCredentials) {
              this.snackBar.open('Wrong Username or Password', 'Try again', {
                duration: 5 * 1000,
              });
            } else {
              this.snackBar.open(
                'An unexpected Error happened',
                'Try again later'
              );
            }
            return of();
          })
        )
        .subscribe(() => this.router.navigate(['grades']));
    }
  }
}
