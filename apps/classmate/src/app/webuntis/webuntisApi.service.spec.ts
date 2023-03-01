import { TestBed } from '@angular/core/testing';

import { WebuntisApiService } from './webuntisApi.service';

describe('WebuntisService', () => {
  let service: WebuntisApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebuntisApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
