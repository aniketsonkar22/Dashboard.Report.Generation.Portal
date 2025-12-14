import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommentsGroupComponent } from './comments-group.component';

describe('CommentsGroupComponent', () => {
  let component: CommentsGroupComponent;
  let fixture: ComponentFixture<CommentsGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommentsGroupComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommentsGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
