import { TestBed } from '@angular/core/testing';

import { AuthServiceAD } from './auth-ad.service';

describe('AuthServiceAD', () => {
  let service: AuthServiceAD;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthServiceAD);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
