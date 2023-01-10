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
} from 'rxjs';
import {
  DataSubject,
  dto,
  GetCurrentSchoolYearDtoResponse,
  Grade,
  GradeCollectionBySubject,
  jsonRpcVersion,
  Lesson,
  LoginDtoResponse,
  Method,
  Person,
  PersonType,
  SchoolYear,
} from '@webuntis/api-interfaces';
import { CookieService } from 'ngx-cookie-service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Router } from '@angular/router';

interface jwtToken {
  tenant_id: string; // "1243800"
  sub: string; // "Amh-Rap"
  roles: string; // "STUDENT"
  iss: string; // "webuntis"
  locale: string; // "de"
  sc: string; // "it"
  user_type: string; // "USER"
  user_id: number; // 949
  host: string; // "mese.webuntis.com"
  sn: string; // "lbs-brixen"
  scopes: string; // "mg:r"
  exp: number; // 1672911732
  per: string[]; // ["mg:r"]
  iat: number; // 1672910832
  username: string; // "Amh-Rap"
  sr: string; // "IT-32"
  person_id: 770;
}

@Injectable({
  providedIn: 'root',
})
export class WebuntisService {
  apiDefinition = {
    baseUrl: '/api/WebUntis/api/',
    jsonRpcVersion: jsonRpcVersion,
    jsonRpcUrl: '/api/WebUntis/jsonrpc.do',
    client: 'geekUntis',
  };

  jsonrpcApiConnection = {
  };

  set school(v: string) {
    localStorage.setItem('school', v)
  }

  get school(): string {
    return localStorage.getItem('school') || ''
  }
  
  set currentYear(v : SchoolYear | null) {
    localStorage.setItem('schoolYear', JSON.stringify(v))
  }

  get currentYear(): SchoolYear | null {
    const i = localStorage.getItem('schoolYear')
    if (i) {
      return JSON.parse(i) as SchoolYear
    }
    else {
      return null
    }
  }

  set student(v: Person) {
    localStorage.setItem('student', JSON.stringify(v));
  }

  get student(): Person {
    const student = localStorage.getItem('student');
    if (student) {
      return JSON.parse(student);
    }
    console.log(student);
    throw Error('Not logged in as a User');
  }

  set sessionId(v: string) {
    this.cookieService.set('JSESSIONID', v);
  }

  get sessionId(): string {
    return this.cookieService.get('JSESSIONID')
  }

  set token(v: string) {
    localStorage.setItem('apiToken', v);
  }

  get token(): string {
    return localStorage.getItem('apiToken') || ''
  }

  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    public jwtHelper: JwtHelperService
  ) {}

  subject!: {
    klasseId: number;
    personId: number;
    personType: PersonType;
    sessionId: string;
  };
  data!: DataSubject;

  postJsonRpcApi<T>(method: Method, params: object = {}) {
    const body: dto = {
      id: 1,
      method: method,
      params: params,
      jsonrpc: this.apiDefinition.jsonRpcVersion,
    };
    return this.http.post<T>(`${this.apiDefinition.jsonRpcUrl}?school=${this.school}`, body);
  }

  getApi<T>(
    path: string,
    headers?: HttpHeaders | { [header: string]: string | string[] } | undefined
  ) {
    return this.http
      .get<T>(this.apiDefinition.baseUrl + path, { headers: headers })
      .pipe(
        tap(() => {
          if (!this.jwtHelper.tokenGetter()) {
            throwError(() => Error('Not connected - GeekUntis'));
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
        this.data = loginData;
        if (this.data.user.roles.includes('STUDENT')) {
          this.student = this.data.user.person;
        } else {
          this.student = this.data.user.students[0];
        }
      })
    )

    const token$ = this.http
    .get('/api/WebUntis/api/token/new', { responseType: 'text' })
    .pipe(
      tap((jwtToken) => {
        this.token = jwtToken
      }),
      switchMap(() => data$)
    );

    const currentSchoolYear$ = this.getCurrentSchoolYear().pipe(
      tap(currentSchoolYear => this.currentYear = currentSchoolYear.result),
      mergeMap(() => token$)
    )

    const session$ = this.postJsonRpcApi<LoginDtoResponse>(Method.AUTH, {
      user: username,
      password: password,
      client: this.apiDefinition.client,
    }).pipe(
      tap((jsonRpcAuth) => {
        this.subject = jsonRpcAuth.result;
        this.sessionId = this.subject.sessionId;
      }),
      shareReplay()
    );

    return session$.pipe(
      switchMap(() => currentSchoolYear$)
    )
  }

  isLoggedIn(): boolean {
    // TODO: Update to check all data
    return Boolean(this.jwtHelper.tokenGetter());
  }

  logout(router: Router): Observable<any> {
    return this.postJsonRpcApi(Method.LOGOUT).pipe(
      finalize(() => {
        this.cookieService.deleteAll();
        localStorage.clear();
        router.navigate(['/']);
      })
    );
  }

  getLessons(): Observable<Lesson> {
    return this.getApi<{ data: { lessons: Lesson[] } }>(
      `classreg/grade/grading/list?studentId=${this.student.id}&schoolyearId=${this.currentYear?.id}`
    ).pipe(mergeMap((value) => from(value.data.lessons)));
  }

  getData(): Observable<DataSubject> {
    return this.getApi<DataSubject>('rest/view/v1/app/data');
  }

  getCurrentSchoolYear(): Observable<GetCurrentSchoolYearDtoResponse> {
    return this.postJsonRpcApi<GetCurrentSchoolYearDtoResponse>(Method.GETCURRENTSCHOOLYEAR);
  }

  getGrades(): Observable<GradeCollectionBySubject> {
    return this.getLessons().pipe(
      mergeMap((lesson) => {
        return this.getApi<{ data: GradeCollectionBySubject }>(
          `classreg/grade/grading/lesson?studentId=${this.student.id}&lessonId=${lesson.id}`
        ).pipe(
          map((data) => {
            const res = data.data;
            res.gradesWithMarks = res.grades.filter(
              (value: Grade) => value.mark.markValue != 0
            );
            if (res.gradesWithMarks.length > 0) {
              res.averageMark = Number(
                (
                  res.gradesWithMarks.reduce(
                    (sum, current) => (sum += current.mark.markValue),
                    0
                  ) /
                  res.gradesWithMarks.length /
                  100
                ).toFixed(2)
              );
            } else {
              res.averageMark = 0;
            }
            return res;
          })
        );
      })
    );
  }
}
