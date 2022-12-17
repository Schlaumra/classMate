import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, tap, map, mergeMap, from} from "rxjs";
import {DataSubject, dto, GetCurrentSchoolYearDtoResponse, GetDepartmentsDtoResponse, GetHolidaysDtoResponse, GetRoomsDtoResponse, GetStatusDataDtoResponse, GetSubjectsDtoResponse, GetTimegridUnitsDtoResponse, Grade, GradeCollectionBySubject, jsonRpc, Lesson, LoginDto, LoginDtoResponse, Method, Person, PersonType} from "@webuntis/api-interfaces";
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root'
})
export class WebuntisService {
  oldBaseUrl = '/api/WebUntis/jsonrpc.do'
  baseUrl = '/api/WebUntis/api/'
  client = 'geekUntis'
  token = ''
  jsonRpcVersion = jsonRpc

  school!: string
  subject!: { klasseId: number; personId: number; personType: PersonType; sessionId: string; }
  student!: Person
  data!: DataSubject
  sessionId!: string


  constructor(private http: HttpClient, private cookieService: CookieService) { }

  postOldApi<T>(method: Method, params: object = {}) {
    const body: dto = {
      id: 1,
      method: method,
      params: params,
      jsonrpc: this.jsonRpcVersion
    }
    return this.http.post<T>(this.oldBaseUrl, body);
  }

  getApi<T>(path: string, headers?: HttpHeaders | {[header: string]: string | string[];} | undefined) {
    return this.http.get<T>(this.baseUrl + path, { headers: headers })
  }

  login(school: string, username: string, password: string): Observable<DataSubject> {
    this.oldBaseUrl = `${this.oldBaseUrl}?school=${school}`
    this.school = school

    return this.postOldApi<LoginDtoResponse>(Method.AUTH, { user: username, password: password, client: this.client}).pipe(
      tap(value => {
        this.subject = value.result
        this.cookieService.set('JSESSIONID', this.subject.sessionId);
      }),
      mergeMap(() => {
        return this.http.get('/api/WebUntis/api/token/new', {responseType: "text" }).pipe(
          tap(value2 => this.token = value2),
          mergeMap(() => {
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
    return this.postOldApi(Method.LOGOUT);
  }

  getSubjects(): Observable<GetSubjectsDtoResponse> {
    return this.postOldApi<GetSubjectsDtoResponse>(Method.GETSUBJECTS);
  }

  getRooms(): Observable<GetRoomsDtoResponse> {
    return this.postOldApi<GetRoomsDtoResponse>(Method.GETROOMS)
  }

  getDepartements(): Observable<GetDepartmentsDtoResponse> {
    return this.postOldApi<GetDepartmentsDtoResponse>(Method.GETDEPARTMENTS)
  }

  getHolidays(): Observable<GetHolidaysDtoResponse> {
    return this.postOldApi<GetHolidaysDtoResponse>(Method.GETHOLIDAYS)
  }

  getTimeGridUnits(): Observable<GetTimegridUnitsDtoResponse> {
    return this.postOldApi<GetTimegridUnitsDtoResponse>(Method.GETTIMEGRIDUNITS)
  }

  getStatusData(): Observable<GetStatusDataDtoResponse> {
    return this.postOldApi<GetStatusDataDtoResponse>(Method.GETSTATUSDATA)
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
      Authorization: `Bearer ${this.token}`
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
                res.averageMark = res.gradesWithMarks.reduce((sum, current) => sum += current.mark.markValue, 0) / res.gradesWithMarks.length / 100
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
