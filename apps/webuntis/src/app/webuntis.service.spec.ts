import { TestBed } from '@angular/core/testing';

import { WebuntisService } from './webuntis.service';

describe('WebuntisService', () => {
  let service: WebuntisService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebuntisService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
