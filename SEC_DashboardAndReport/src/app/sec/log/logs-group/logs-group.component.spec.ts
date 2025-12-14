import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogsGroupComponent } from './logs-group.component';

describe('LogsGroupComponent', () => {
  let component: LogsGroupComponent;
  let fixture: ComponentFixture<LogsGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LogsGroupComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LogsGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
