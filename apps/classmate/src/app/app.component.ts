import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Person } from '@classmate/api-interfaces';
import { LoadingService } from './loading/loading.service';
import { WebuntisApiService } from './webuntis/webuntisApi.service';

@Component({
  selector: 'classmate-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(
    private webUntis: WebuntisApiService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    protected loading: LoadingService
  ) {}

  /**
   * Logout of the API and the application
   */
  logout() {
    this.loading.setLoading(true);
    this.webUntis.logout().subscribe();
  }

  /**
   * Checks if the API is logged in
   * 
   * @returns true = logged in
   */
  isLoggedIn(): boolean {
    return this.webUntis.isLoggedIn();
  }

  /**
   * Gets if the current view is nested and there should be a back button
   * 
   * @returns true = it is a subview
   */
  backExists(): boolean {
    return this.activatedRoute.firstChild?.snapshot.routeConfig?.path ===
      'subject'
      ? true
      : false;
  }

  /**
   * Get back to grades
   */
  back() {
    this.router.navigate(['grades']);
  }

  /**
   * Get back to home
   */
  backToHome() {
    this.router.navigate(['']);
  }

  /**
   * Get all users (parent account has more students)
   * 
   * @returns An array of the logged in users 
   */
  getUsers(): Person[] | null {
    if (this.webUntis.isLoggedIn()) {
      return this.webUntis.students;
    } else {
      this.webUntis.logout();
      return null;
    }
  }

  /**
   * Get all users except the current one
   * 
   * @returns An Array of the logged in users
   */
  getUsersExceptCurrent(): Person[] | null {
    if (this.webUntis.isLoggedIn()) {
      return this.webUntis.students.filter(
        (value, index) => index != this.webUntis.currentStudent
      );
    } else {
      this.webUntis.logout();
      return null;
    }
  }

  /**
   * Get the current user as a Person
   * 
   * @returns An Person
   */
  getCurrentUser(): Person | null {
    if (this.webUntis.isLoggedIn()) {
      return this.webUntis.students[this.webUntis.currentStudent];
    } else {
      this.webUntis.logout();
      return null;
    }
  }

  /**
   * Set the Person that it is requested to show the data from
   * 
   * @param user Person
   */
  setUser(user: Person) {
    this.webUntis.currentStudent =
      this.getUsers()?.findIndex((element) => element.id == user.id) || 0;
    window.location.reload();
  }
}
