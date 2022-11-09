import { Component, OnInit } from '@angular/core';
import {FormBuilder, Validators} from "@angular/forms";
import {WebuntisService} from "../webuntis.service";
import {PersonType} from "@webuntis/api-interfaces";
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

  private subject: Observable<{ klasseId: number; personId: number; personType: PersonType; sessionId: string; }> | undefined

  constructor(private webUntis: WebuntisService, private formBuilder: FormBuilder, private router: Router) {

  }
  ngOnInit(): void {
    console.log("Init")
  }

  login(): boolean {
    const { username, password } = this.loginForm.value;
    if (username && password)
    {
      this.subject = this.webUntis.login(this.school, username, password).pipe(
        map(value => value.result)
      )

      this.subject.subscribe(value => {
        console.log(value)
        this.router.navigate(['grades'])
      })
    }
    return false
  }

  logout() {
    console.log("Logout")
    this.webUntis.logout().subscribe()
  }

  test() {
    console.log("testing")

    // this.webUntis.getSubjects().subscribe(value => console.log(value))

    // this.webUntis.getRooms().subscribe(value => console.log(value))

    // this.webUntis.getDepartements().subscribe(value => console.log(value))

    // this.webUntis.getHolidays().subscribe(value => console.log(value))

    // this.webUntis.getTimeGridUnits().subscribe(value => console.log(value))

    // this.webUntis.getStatusData().subscribe( value => console.log(value))

    // this.webUntis.getCurrentSchoolYear().subscribe(value => console.log(value))

    // this.webUntis.getSchoolYears().subscribe(value => console.log(value))

    // this.webUntis.getGrades().subscribe(value => console.log(value))

    // this.webUntis.getGrades().subscribe(value => console.log(value))
  }
}
