import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, tap, map, mergeMap, from} from "rxjs";
import {dto, GetCurrentSchoolYearDtoResponse, GetDepartmentsDtoResponse, GetHolidaysDtoResponse, GetRoomsDtoResponse, GetStatusDataDtoResponse, GetSubjectsDtoResponse, GetTimegridUnitsDtoResponse, Grade, GradeCollectionBySubject, jsonRpc, Lesson, LoginDto, LoginDtoResponse, Method, PersonType} from "@webuntis/api-interfaces";
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root'
})
export class WebuntisService {
  oldBaseUrl = '/api/WebUntis/jsonrpc.do'
  baseUrl = '/api/WebUntis/api/'
  client = 'geekUntis'
  jsonRpcVersion = jsonRpc

  school!: string
  subject!: { klasseId: number; personId: number; personType: PersonType; sessionId: string; }
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

  getApi<T>(path: string) {
    return this.http.get<T>(this.baseUrl + path)
  }

  login(school: string, username: string, password: string): Observable<LoginDtoResponse> {
    this.oldBaseUrl = `${this.oldBaseUrl}?school=${school}`
    this.school = school


    return this.postOldApi<LoginDtoResponse>(Method.AUTH, { user: username, password: password, client: this.client}).pipe(
      tap(value => {
        this.subject = value.result
        this.cookieService.set('JSESSIONID', this.subject.sessionId);

        // this.http.get('/api/WebUntis/api/token/new', {responseType: "text" }).subscribe(val => console.log(val))
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
    return this.getApi<{ data: { lessons: Lesson[] }}>(`classreg/grade/grading/list?studentId=${this.subject.personId}&schoolyearId=12`)
    .pipe(
      mergeMap(value => from(value.data.lessons))
    )
  }

  getGrades(): Observable<GradeCollectionBySubject> {
    return this.getLessons().pipe(
      mergeMap(lesson => {
        return this.getApi<{data: GradeCollectionBySubject}>(`classreg/grade/grading/lesson?studentId=${this.subject.personId}&lessonId=${lesson.id}`)
          .pipe(
            map(data => data.data)
          )
      })
    )
  }

}
