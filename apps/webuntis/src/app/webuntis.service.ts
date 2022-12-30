import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, tap, map, mergeMap, from, concatMap, switchMap, forkJoin} from "rxjs";
import {DataSubject, dto, GetCurrentSchoolYearDtoResponse, Grade, GradeCollectionBySubject, jsonRpc, Lesson, LoginDtoResponse, Method, Person, PersonType} from "@webuntis/api-interfaces";
import { CookieService } from 'ngx-cookie-service';

interface ApiConnection {
  connected: boolean,
  token: string,
  school: string
  logout: () => void
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

  apiConnection: ApiConnection = {
    connected: false,
    token: '',
    school: '',
    logout: () => {
      this.apiConnection.connected = false
      this.apiConnection.token = ''
      this.apiConnection.school = ''
    }
  }




  

  subject!: { klasseId: number; personId: number; personType: PersonType; sessionId: string; }
  student!: Person
  data!: DataSubject


  constructor(private http: HttpClient, private cookieService: CookieService) { }

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
    if (this.apiConnection.connected) {
      return this.http.get<T>(this.apiDefinition.baseUrl + path, { headers: headers })
    }
    else {
      throw Error("Not connected - GeekUntis")
    }
  }

  login(school: string, username: string, password: string): Observable<DataSubject> {
    this.oldApiConnection.currentUrl = `${this.oldApiConnection.baseUrl}?school=${school}`
    this.apiConnection.school = school

    return this.postOldApi<LoginDtoResponse>(Method.AUTH, { user: username, password: password, client: this.apiDefinition.client}).pipe(
      tap(value => {
        this.subject = value.result
        this.cookieService.set('JSESSIONID', this.subject.sessionId);
      }),
      switchMap(() => {
        return this.http.get('/api/WebUntis/api/token/new', {responseType: "text" }).pipe(
          tap(value2 => {
            console.log("TOKEN")
            this.apiConnection.token = value2
            this.apiConnection.connected = true
          }),
          switchMap(() => {
            return this.getData().pipe(
              tap(value3 => {
                this.data = value3
                if (this.data.user.roles.includes("STUDENT")) {
                  this.student = this.data.user.person
                }
                else {
                  this.student = this.data.user.students[0]
                }
              })
            )
          })
        )
      })
    );
  }

  logout(): Observable<any> {
    // TODO: Try to logout else do rest
    return this.postOldApi(Method.LOGOUT).pipe(
      tap(() => {
        this.apiConnection.logout()
        this.oldApiConnection.logout()
        this.cookieService.deleteAll()
        console.log(this.apiConnection, this.oldApiConnection)
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
    const httpHeaders: HttpHeaders = new HttpHeaders({
      Authorization: `Bearer ${this.apiConnection.token}`
    });
    return this.getApi<DataSubject>('rest/view/v1/app/data', httpHeaders)
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
