import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap, shareReplay } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) {}
    
  login(school: string, username: string, password: string) {



    return this.http.post('/api/login', {email, password}).pipe(
      tap(authResult => {
        const expiresAt = moment().add(authResult.expiresIn,'second');

        localStorage.setItem('id_token', authResult.idToken);
      }),
      shareReplay()
    )
  }
      
  logout() {
      localStorage.removeItem("id_token");
      localStorage.removeItem("expires_at");
  }
}
