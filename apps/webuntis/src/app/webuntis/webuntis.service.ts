import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, tap, map, mergeMap, from, switchMap, throwError, finalize, shareReplay} from "rxjs";
import {DataSubject, dto, GetCurrentSchoolYearDtoResponse, Grade, GradeCollectionBySubject, jsonRpc, Lesson, LoginDtoResponse, Method, Person, PersonType} from "@webuntis/api-interfaces";
import { CookieService } from 'ngx-cookie-service';
import { JwtHelperService } from '@auth0/angular-jwt';

interface jwtToken {
  tenant_id: string,          // "1243800"
  sub: string,                // "Amh-Rap"
  roles: string,              // "STUDENT"
  iss: string,                // "webuntis"
  locale: string,             // "de"
  sc: string,                 // "it"
  user_type: string,          // "USER"
  user_id: number,            // 949
  host: string,               // "mese.webuntis.com"
  sn: string,                 // "lbs-brixen"
  scopes: string,             // "mg:r"
  exp: number,                // 1672911732
  per: string[],              // ["mg:r"]
  iat: number,                // 1672910832
  username: string,           // "Amh-Rap"
  sr: string,                 // "IT-32"
  person_id: 770
}

@Injectable({
  providedIn: 'root'
})
export class WebuntisService {

  oldApiConnection = {
    jsonRpcVersion: jsonRpc,
    baseUrl: '/api/WebUntis/jsonrpc.do',
    currentUrl: '',
    logout: () => {
      this.oldApiConnection.currentUrl = ''
    }
  }
  apiDefinition = {
    baseUrl: '/api/WebUntis/api/',
    client: 'geekUntis',
  }
  school = ''

  set student(v : Person) {
    localStorage.setItem('student', JSON.stringify(v))
  }

  
  get student() : Person {
    const student = localStorage.getItem('student')
    if (student) { return JSON.parse(student) }
    console.log(student)
    throw Error("Not logged in as a User")
  }


  
  subject!: { klasseId: number; personId: number; personType: PersonType; sessionId: string; }
  data!: DataSubject


  constructor(private http: HttpClient, private cookieService: CookieService, public jwtHelper: JwtHelperService) { }

  

  

  postOldApi<T>(method: Method, params: object = {}) {
    const body: dto = {
      id: 1,
      method: method,
      params: params,
      jsonrpc: this.oldApiConnection.jsonRpcVersion
    }
    return this.http.post<T>(this.oldApiConnection.currentUrl, body);
  }

  getApi<T>(path: string, headers?: HttpHeaders | {[header: string]: string | string[];} | undefined) {
    return this.http.get<T>(this.apiDefinition.baseUrl + path, { headers: headers }).pipe(
      tap(() => {
        if (!this.jwtHelper.tokenGetter()) {
          throwError(() => Error("Not connected - GeekUntis"))
        }
      })
    )
  }

  login(school: string, username: string, password: string): Observable<DataSubject> {

    this.oldApiConnection.currentUrl = `${this.oldApiConnection.baseUrl}?school=${school}`
    this.school = school

    return this.postOldApi<LoginDtoResponse>(Method.AUTH, { user: username, password: password, client: this.apiDefinition.client}).pipe(
      tap(value => {
        this.subject = value.result
        this.cookieService.set('JSESSIONID', this.subject.sessionId);
      }),
      switchMap(() => {
        return this.http.get('/api/WebUntis/api/token/new', {responseType: "text" }).pipe(
          tap(token => {
            localStorage.setItem('apiToken', token)
          }),
          switchMap(() => this.getData().pipe(
            tap(value3 => {
              this.data = value3
              console.log(this.data)
              const apiToken = this.jwtHelper.tokenGetter()
              if (apiToken)
              {
                console.log(this.jwtHelper.decodeToken(apiToken.toString()))
              }
              if (this.data.user.roles.includes("STUDENT")) {
                this.student = this.data.user.person
              }
              else {
                this.student = this.data.user.students[0]
              }
            })
          ))
        )
      }),
      shareReplay()
    );
  }

  logout(): Observable<any> {
    return this.postOldApi(Method.LOGOUT).pipe(
      finalize(() => {
        this.school = ''
        this.oldApiConnection.logout()
        this.cookieService.deleteAll()
        localStorage.clear()
      })
    );
  }

  getCurrentSchoolYear(): Observable<GetCurrentSchoolYearDtoResponse> {
    return this.postOldApi<GetCurrentSchoolYearDtoResponse>(Method.GETCURRENTSCHOOLYEAR);
  }

  getSchoolYears(): Observable<GetCurrentSchoolYearDtoResponse[]> {
    return this.postOldApi<GetCurrentSchoolYearDtoResponse[]>(Method.GETSCHOOLYEARS)
  }

  getLessons(): Observable<Lesson> {
    return this.getApi<{ data: { lessons: Lesson[] }}>(`classreg/grade/grading/list?studentId=${this.student.id}&schoolyearId=12`)
    .pipe(
      mergeMap(value => from(value.data.lessons))
    )
  }

  getData(): Observable<DataSubject> {
    return this.getApi<DataSubject>('rest/view/v1/app/data')
  }

  getGrades(): Observable<GradeCollectionBySubject> {
    return this.getLessons().pipe(
      mergeMap(lesson => {
        return this.getApi<{data: GradeCollectionBySubject}>(`classreg/grade/grading/lesson?studentId=${this.student.id}&lessonId=${lesson.id}`)
          .pipe(
            map(data => {
              const res = data.data
              res.gradesWithMarks = res.grades.filter((value: Grade) => value.mark.markValue != 0);
              if (res.gradesWithMarks.length > 0) {
                res.averageMark = Number((res.gradesWithMarks.reduce((sum, current) => sum += current.mark.markValue, 0) / res.gradesWithMarks.length / 100).toFixed(2))
              }
              else {
                res.averageMark = 0
              }
              return res
            })
          )
      })
    )
  }

}
