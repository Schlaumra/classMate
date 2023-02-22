import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private loading = new BehaviorSubject<boolean>(false);
  isLoading$ = this.loading.asObservable();

  setLoading(loading: boolean) {
    this.loading.next(loading);
  }
}
