import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  Observable,
  tap,
  map,
  mergeMap,
  from,
  switchMap,
  throwError,
  finalize,
  shareReplay,
  filter,
} from 'rxjs';
import {
  DataSubject,
  dto,
  GetCurrentSchoolYearDtoResponse,
  GetSubjectsDtoResponse,
  Subject,
  Grade,
  GradeCollectionBySubject,
  jsonRpcVersion,
  Lesson,
  LoginDtoResponse,
  Method,
  Person,
  SchoolYear,
  BadCredentials,
} from '@classmate/api-interfaces';
import { CookieService } from 'ngx-cookie-service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Router } from '@angular/router';
import { withCache } from '@ngneat/cashew';

@Injectable({
  providedIn: 'root',
})
export class WebuntisApiService {
  apiDefinition = {
    baseUrl: '/api/WebUntis/api/',
    jsonRpcVersion: jsonRpcVersion,
    jsonRpcUrl: '/api/WebUntis/jsonrpc.do',
    client: 'classMate',
  };

  jsonrpcApiConnection = {};

  set school(v: string) {
    localStorage.setItem('school', v);
  }

  get school(): string {
    return localStorage.getItem('school') || '';
  }

  set currentStudent(v: number) {
    localStorage.setItem('currentStudent', String(v));
  }

  get currentStudent(): number {
    return Number(localStorage.getItem('currentStudent')) || 0;
  }

  set currentYear(v: SchoolYear | null) {
    localStorage.setItem('schoolYear', JSON.stringify(v));
  }

  get currentYear(): SchoolYear | null {
    const i = localStorage.getItem('schoolYear');
    if (i) {
      return JSON.parse(i) as SchoolYear;
    } else {
      return null;
    }
  }

  set students(v: Person[]) {
    localStorage.setItem('student', JSON.stringify(v));
  }

  get students(): Person[] {
    const student = localStorage.getItem('student');
    if (student) {
      return JSON.parse(student);
    }
    throw Error("Not logged in")
  }

  set sessionId(v: string) {
    this.cookieService.set('JSESSIONID', v);
  }

  get sessionId(): string {
    return this.cookieService.get('JSESSIONID');
  }

  set token(v: string) {
    localStorage.setItem('apiToken', v);
  }

  get token(): string {
    return localStorage.getItem('apiToken') || '';
  }

  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private router: Router,
    public jwtHelper: JwtHelperService
  ) {}

  postJsonRpcApi<T>(
    method: Method,
    params: object = {},
    caching: boolean | string = false
  ) {
    const body: dto = {
      id: 1,
      method: method,
      params: params,
      jsonrpc: this.apiDefinition.jsonRpcVersion,
    };
    const cache =
      caching.toString() != 'true' ? { key: caching.toString() } : {};

    return this.http.post<T>(
      `${this.apiDefinition.jsonRpcUrl}?school=${this.school}`,
      body,
      { context: caching ? withCache(cache) : undefined }
    );
  }

  getApi<T>(
    path: string,
    headers?: HttpHeaders | { [header: string]: string | string[] } | undefined,
    caching?: boolean
  ) {
    return this.http
      .get<T>(this.apiDefinition.baseUrl + path, {
        headers: headers,
        context: caching ? withCache() : undefined,
      })
      .pipe(
        tap(() => {
          if (!this.jwtHelper.tokenGetter()) {
            throwError(() => Error('Not connected - ClassMate'));
          }
        })
      );
  }

  login(
    school: string,
    username: string,
    password: string
  ): Observable<DataSubject> {
    this.school = school;

    const data$ = this.getData().pipe(
      tap((loginData) => {
        const data: DataSubject = loginData;
        if (data.user.roles.includes('STUDENT')) {
          this.students = [data.user.person];
        } else {
          this.students = data.user.students;
        }
      })
    );

    const token$ = this.http
      .get('/api/WebUntis/api/token/new', { responseType: 'text' })
      .pipe(
        tap((jwtToken) => {
          this.token = jwtToken;
        }),
        switchMap(() => data$)
      );

    const currentSchoolYear$ = this.getCurrentSchoolYear().pipe(
      tap((currentSchoolYear) => (this.currentYear = currentSchoolYear.result)),
      mergeMap(() => token$)
    );

    const session$ = this.postJsonRpcApi<LoginDtoResponse>(Method.AUTH, {
      user: username,
      password: password,
      client: this.apiDefinition.client,
    }).pipe(
      tap((jsonRpcAuth) => {
        if (jsonRpcAuth.error) {
          const error = jsonRpcAuth.error;
          if (error.code == BadCredentials.ErrCode) {
            throw new BadCredentials();
          } else {
            throw Error(`(${error.code}): ${error.message}`);
          }
        } else {
          this.sessionId = jsonRpcAuth.result.sessionId;
        }
      }),
      shareReplay()
    );

    return session$.pipe(switchMap(() => currentSchoolYear$));
  }

  isLoggedIn(): boolean {
    let loggedIn = true
    try {
      loggedIn = loggedIn
        && Boolean(this.students.length)
        && Boolean(this.jwtHelper.tokenGetter())
        && Boolean(this.sessionId)
      return loggedIn
    }
    catch {
      return false
    }
    // TODO: Update to check all data
  }

  logout(): Observable<undefined> {
    return this.postJsonRpcApi(Method.LOGOUT).pipe(
      map(() => undefined),
      finalize(() => {
        this.cookieService.deleteAll();
        localStorage.clear();
        this.router.navigate(['/']);
      })
    );
  }

  getSubjects(): Observable<Subject[]> {
    return this.postJsonRpcApi<GetSubjectsDtoResponse>(
      Method.GETSUBJECTS,
      undefined,
      'getSubjects'
    ).pipe(map((value) => value.result));
  }

  getSubject(name: string): Observable<Subject | undefined> {
    return this.getSubjects().pipe(
      map((value) => value.find((val) => val.name == name))
    );
  }

  getLessons(): Observable<Lesson> {
    return this.getApi<{ data: { lessons: Lesson[] } }>(
      `classreg/grade/grading/list?studentId=${this.students[this.currentStudent].id}&schoolyearId=${this.currentYear?.id}`,
      undefined,
      true
    ).pipe(mergeMap((value) => from(value.data.lessons)));
  }

  getData(): Observable<DataSubject> {
    return this.getApi<DataSubject>('rest/view/v1/app/data');
  }

  getCurrentSchoolYear(): Observable<GetCurrentSchoolYearDtoResponse> {
    return this.postJsonRpcApi<GetCurrentSchoolYearDtoResponse>(
      Method.GETCURRENTSCHOOLYEAR,
      undefined,
      'getCurrentSchoolYear'
    );
  }

  getSubjectGrades(lessonId: number): Observable<GradeCollectionBySubject> {
    return this.getApi<{ data: GradeCollectionBySubject }>(
      `classreg/grade/grading/lesson?studentId=${this.students[this.currentStudent].id}&lessonId=${lessonId}`,
      undefined,
      true
    ).pipe(
      filter((data) => data.data.lesson.subjects != ''),
      map((data) => {
        const res = data.data;
        res.gradesWithMarks = res.grades.filter(
          (value: Grade) => value.mark.markValue != 0
        );
        if (res.gradesWithMarks.length > 0) {
          res.positiveMarks = res.gradesWithMarks.filter(
            (value: Grade) => value.mark.markDisplayValue >= 6
          ).length;
          res.negativeMarks = res.gradesWithMarks.filter(
            (value: Grade) => value.mark.markDisplayValue < 6
          ).length;
          res.averageMark =
            res.gradesWithMarks.reduce(
              (sum, current) => (sum += current.mark.markValue),
              0
            ) /
            res.gradesWithMarks.length /
            100;
        } else {
          res.averageMark = 0;
        }
        return res;
      })
    );
  }

  getGrades(): Observable<GradeCollectionBySubject> {
    return this.getLessons().pipe(
      mergeMap((lesson) => this.getSubjectGrades(lesson.id))
    );
  }

  convertDate(date: string): Date {
    const year = Number(date.slice(0, 4));
    const month = Number(date.slice(4, 6));
    const day = Number(date.slice(-2));
    return new Date(year, month - 1, day);
  }
}
