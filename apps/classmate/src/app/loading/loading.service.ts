import { Injectable } from '@angular/core';
import { BehaviorSubject, share } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private loading = new BehaviorSubject<boolean>(false);
  isLoading$ = this.loading.asObservable().pipe(share());

  /**
   * Set the loading state
   * 
   * @param loading true = loading
   */
  setLoading(loading: boolean) {
    this.loading.next(loading);
  }
}
