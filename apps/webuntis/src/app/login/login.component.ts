import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from "@angular/forms";
import { WebuntisService } from "../webuntis/webuntis.service";
import { Router } from '@angular/router';


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

  constructor(private webUntis: WebuntisService, private formBuilder: FormBuilder, private router: Router) {

  }
  ngOnInit(): void {
    this.school = 'lbs-brixen';
  }

  login(): void {
    const { username, password } = this.loginForm.value;
    if (username && password)
    {
      this.webUntis.login(this.school, username, password).subscribe(() => this.router.navigate(['grades']))
    }
  }
}
