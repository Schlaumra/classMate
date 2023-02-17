import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from "@angular/forms";
import { WebuntisService } from "../webuntis/webuntis.service";
import { Router } from '@angular/router';
import { LoadingService } from '../loading/loading.service';


@Component({
  selector: 'webuntis-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  private school = ""

  loginForm = this.formBuilder.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });
  hide = true

  constructor(private webUntis: WebuntisService, private formBuilder: FormBuilder, private router: Router, private contentLoading: LoadingService) {

  }
  ngOnInit(): void {
    this.school = 'lbs-brixen';
    if (this.webUntis.isLoggedIn()) {
      this.router.navigate(['grades'])
    }
    this.webUntis.logout(this.router)
    this.contentLoading.setLoading(false)
  }

  login(): void {
    const { username, password } = this.loginForm.value;
    this.contentLoading.setLoading(true);
    if (username && password)
    {
      this.webUntis.login(this.school, username, password).subscribe(() => this.router.navigate(['grades']))
    }
  }
}
