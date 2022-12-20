import { Component, OnInit } from '@angular/core';
import {FormBuilder, Validators} from "@angular/forms";
import {WebuntisService} from "../webuntis.service";
import {DataSubject, LoginDtoResponse, PersonType} from "@webuntis/api-interfaces";
import {map, Observable} from "rxjs";
import { Router } from '@angular/router';


@Component({
  selector: 'webuntis-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  baseUrl = 'localhost:4200/api';
  school = 'lbs-brixen';

  loginForm = this.formBuilder.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  private subject: Observable<[DataSubject, LoginDtoResponse]> | undefined

  constructor(private webUntis: WebuntisService, private formBuilder: FormBuilder, private router: Router) {

  }
  ngOnInit(): void {
    console.log(this.subject)
    console.log(this.webUntis.data)
    console.log(this.webUntis.apiConnection)
  }

  login(): boolean {
    const { username, password } = this.loginForm.value;
    if (username && password)
    {
      this.subject = this.webUntis.login(this.school, username, password)

      this.subject.subscribe(value => {
        console.log(value)
        this.router.navigate(['grades'])
      })
    }
    return false
  }
}
