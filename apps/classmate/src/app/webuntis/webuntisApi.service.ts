import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import {
  BadCredentials,
  DataSubject,
  dto,
  GetCurrentSchoolYearDtoResponse,
  GetSchoolYearsDtoResponse,
  GetSubjectsDtoResponse,
  Grade,
  GradeCollectionBySubject,
  jsonRpcVersion,
  Lesson,
  LoginDtoResponse,
  Method,
  Person,
  SchoolYear,
  Subject,
} from '@classmate/api-interfaces';
import { withCache } from '@ngneat/cashew';
import { CookieService } from 'ngx-cookie-service';
import {
  filter,
  finalize,
  from,
  map,
  mergeMap,
  Observable,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';


/**
 * WebuntisApiService
 * 
 * Dataconnector for the WebuntisAPI
 */
@Injectable({
  providedIn: 'root',
})
export class WebuntisApiService {
  _schoolYear: SchoolYear[] = []

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

  set currentYear(v: number) {
    localStorage.setItem('currentSchoolYear', String(v));
  }
  get currentYear(): number {
    return Number(localStorage.getItem('currentSchoolYear')) || 0;
  }

  set students(v: Person[]) {
    localStorage.setItem('student', JSON.stringify(v));
  }
  get students(): Person[] {
    const student = localStorage.getItem('student');
    if (student) {
      return JSON.parse(student);
    }
    throw Error('Not logged in');
  }

  set schoolYears(v: SchoolYear[]) {
    this._schoolYear = v
    localStorage.setItem('schoolYears', JSON.stringify(v));
  }
  get schoolYears(): SchoolYear[] {
    const schoolYears = localStorage.getItem('schoolYears');

    if (schoolYears) {
      if (JSON.stringify(this._schoolYear) != schoolYears) {
        this._schoolYear = JSON.parse(schoolYears);
      }
      return this._schoolYear;
    }
    throw Error('Not logged in');
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

  /**
   * Constants for the API
   * baseURL = where the api is located at
   * jsonRpcVersion
   * jsonRpcUrl = where the jsonRpcApi is located at
   * client = a identification string sent to the API
   */
  apiDefinition = {
    baseUrl: '/api/WebUntis/api/',
    jsonRpcVersion: jsonRpcVersion,
    jsonRpcUrl: '/api/WebUntis/jsonrpc.do',
    client: 'classMate',
  };

  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private router: Router,
    public jwtHelper: JwtHelperService
  ) {}

  /**
   * Make a POST request to the JsonRPC API
   * 
   * @param method the jsonRPC Method defined in the API
   * @param params The payload
   * @param caching Wheter to cache the response
   * @returns Observable with the defined type T
   */
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

  /**
   * Send a GET Request to the API
   * 
   * @param path api path
   * @param headers HttpHeaders
   * @param caching if it should be cached or not
   * @returns the response with the defined Type T
   */
  getApi<T>(
    path: string,
    headers?: HttpHeaders | { [header: string]: string | string[] } | undefined,
    caching?: boolean
  ) {
    return this.http
      .get<T>(this.apiDefinition.baseUrl + path, {
        headers: headers,
        context: caching ? withCache() : undefined, // HttpCacheInterceptorModule
      })
      .pipe(
        tap(() => {
          if (!this.jwtHelper.tokenGetter()) { // check if the token is valid
            throwError(() => Error('Not connected - ClassMate'));
          }
        })
      );
  }

  /**
   * Login into the API and get info about the user
   * 
   * @param school the identification string of the school
   * @param username for the WebUntis API
   * @param password for the WebUntis API
   * @returns The data info about the account
   */
  login(
    school: string,
    username: string,
    password: string
  ): Observable<DataSubject> {
    this.school = school;

    // Get the account data
    const data$ = this.getData().pipe(
      tap((loginData) => {
        const data: DataSubject = loginData;
        // Switch between student account and parent account (more students)
        if (data.user.roles.includes('STUDENT')) {
          this.students = [data.user.person];
        } else {
          this.students = data.user.students;
        }
      })
    );

    // Get the token of the second API and change to data
    const token$ = this.http
      .get('/api/WebUntis/api/token/new', { responseType: 'text' })
      .pipe(
        tap((jwtToken) => {
          this.token = jwtToken;
        }),
        switchMap(() => data$)
      );

    // Get the school years and change to token
    const currentSchoolYear$ = this.getSchoolYears().pipe(
      tap((schoolYears) => 
      {
        if (schoolYears.result.length > 0) {
          this.schoolYears = schoolYears.result
          this.currentYear = schoolYears.result.length-1
        }
      }),
      mergeMap(() => token$)
    );

    // Get the sessionId
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

    // Get session and switch to schoolyear -> returns finally the data
    // session -> schoolyear -> token -> data -> return
    return session$.pipe(switchMap(() => currentSchoolYear$));
  }

  /**
   * Get if the user is logged in
   * 
   * @returns true = loggedIn
   */
  isLoggedIn(): boolean {
    let loggedIn = true;
    try {
      loggedIn =
        loggedIn &&
        Boolean(this.students.length) &&
        Boolean(this.jwtHelper.tokenGetter()) &&
        Boolean(this.sessionId);
      return loggedIn;
    } catch {
      return false;
    }
  }

  /**
   * Logout of the API, delete localStorage and navigate to root
   * 
   * @returns An empty observable
   */
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

  /**
   * Get all subjects where the student participates
   * 
   * @returns Observable that emmits an array of Subjects
   */
  getSubjects(): Observable<Subject[]> {
    return this.postJsonRpcApi<GetSubjectsDtoResponse>(
      Method.GETSUBJECTS,
      undefined,
      'getSubjects'
    ).pipe(map((value) => value.result));
  }

  /**
   * Get subject info by name
   * 
   * @param name subject name
   * @returns Observable that emmits the Subject or undefined
   */
  getSubject(name: string): Observable<Subject | undefined> {
    return this.getSubjects().pipe(
      map((value) => value.find((val) => val.name == name))
    );
  }

  /**
   * Get all Lessons
   * 
   * @returns Oservable that emmits the Lesson one by one
   */
  getLessons(): Observable<Lesson> {
    return this.getApi<{ data: { lessons: Lesson[] } }>(
      `classreg/grade/grading/list?studentId=${
        this.students[this.currentStudent].id
      }&schoolyearId=${this.schoolYears[this.currentYear].id}`,
      undefined,
      true
    ).pipe(mergeMap((value) => from(value.data.lessons)));
  }

  /**
   * Get the account data of the user
   * 
   * @returns Observable with the account data
   */
  getData(): Observable<DataSubject> {
    return this.getApi<DataSubject>('rest/view/v1/app/data');
  }

  /**
   * Get info about the current school year
   * 
   * @returns Observable that emmits the current year
   */
  getCurrentSchoolYear(): Observable<GetCurrentSchoolYearDtoResponse> {
    return this.postJsonRpcApi<GetCurrentSchoolYearDtoResponse>(
      Method.GETCURRENTSCHOOLYEAR,
      undefined,
      'getCurrentSchoolYear'
    );
  }

  /**
   * Get info about all school years
   * 
   * @returns Observable that emmits the years
   */
    getSchoolYears(): Observable<GetSchoolYearsDtoResponse> {
      return this.postJsonRpcApi<GetSchoolYearsDtoResponse>(
        Method.GETSCHOOLYEARS,
        undefined,
        'getSchoolYears'
      );
    }

  /**
   * Get the grades for a subject
   * 
   * @param lessonId WebUntis Subject id
   * @returns Observable that emits the grades
   */
  getSubjectGrades(lessonId: number): Observable<GradeCollectionBySubject> {
    // Connect to API and get the grades for a lesson
    return this.getApi<{ data: GradeCollectionBySubject }>(
      `classreg/grade/grading/lesson?studentId=${
        this.students[this.currentStudent].id
      }&lessonId=${lessonId}`,
      undefined,
      true
    ).pipe(
      filter((data) => data.data.lesson.subjects != ''), // Filter out subjects without a name
      map((data) => {
        const res = data.data;
        res.gradesWithMarks = res.grades.filter(
          (value: Grade) => value.mark.markValue != 0 // Filter out marks without marks
        ).map((value: Grade) => {
          value.date = this.convertDate(value.date.toString())
          return value
        });
        if (res.gradesWithMarks.length > 0) {
          // Count positive and negative marks
          res.positiveMarks = res.gradesWithMarks.filter((value: Grade) => value.mark.markDisplayValue >= 6).length;
          res.negativeMarks = res.gradesWithMarks.filter((value: Grade) => value.mark.markDisplayValue < 6).length;
          // Calculate average mark
          res.averageMark = res.gradesWithMarks.reduce(
            (sum, current) => (sum += current.mark.markValue), 0
          ) / res.gradesWithMarks.length / 100;
        } else {
          res.averageMark = 0;
        }
        return res;
      })
    );
  }

  /**
   * Get the grades by subject.
   * 
   * @returns Observable emitting a subject with its grades one at a time
   */
  getGrades(): Observable<GradeCollectionBySubject> {
    return this.getLessons().pipe(
      mergeMap((lesson) => this.getSubjectGrades(lesson.id))
    );
  }

  /**
   * Converts a date string from WebUntis to a Date
   *
   * @param date The date as a string in this format: "19991230"
   * @returns The Date
   *
   */
  convertDate(date: string): Date {
    const year = Number(date.slice(0, 4));
    const month = Number(date.slice(4, 6));
    const day = Number(date.slice(-2));
    return new Date(year, month - 1, day);
  }
}
