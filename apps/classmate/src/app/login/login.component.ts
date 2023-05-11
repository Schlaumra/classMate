import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BadCredentials } from '@classmate/api-interfaces';
import { catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoadingService } from '../loading/loading.service';
import { WebuntisApiService } from '../webuntis/webuntisApi.service';


function required(control: AbstractControl): ValidationErrors | null {
  return Validators.required(control) ? { required: true } : null;
}


@Component({
  selector: 'classmate-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  private school = '';

  // Login form Username and Password
  loginForm = this.formBuilder.group({
    username: [sessionStorage.getItem('username') || '', required],
    password: ['', required],
  });
  hide = true; // If to hide the password or not

  constructor(
    private webUntis: WebuntisApiService,
    private formBuilder: FormBuilder,
    private contentLoading: LoadingService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.school = environment.school;

    // Navigate to grades if it is already logged in
    if (this.webUntis.isLoggedIn()) {
      this.router.navigate(['grades']);
    }

    // Logout to clear the localStorage and stop loading
    this.webUntis.logout();
    this.contentLoading.setLoading(false);
  }

  login(): void {
    const { username, password } = this.loginForm.value;

    if (username && password) {
      this.contentLoading.setLoading(true);

      // Login and reload if an error happens
      sessionStorage.setItem('username', username);
      this.webUntis
        .login(this.school, username, password)
        .pipe(
          catchError((error) => {
            this.contentLoading.setLoading(false);

            console.error(error);

            // Check the error
            if (error instanceof BadCredentials) {
              this.snackBar.open(
                $localize`Wrong Username or Password`,
                $localize`Try again`,
                {
                  duration: 5 * 1000,
                }
              );
            } else {
              this.snackBar.open(
                $localize`An unexpected Error happened`,
                $localize`Try again later`
              );
            }
            return of();
          })
        )
        .subscribe(() => this.router.navigate(['grades']));
    }
  }
}
