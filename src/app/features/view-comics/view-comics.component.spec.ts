import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewComicsComponent } from './view-comics.component';

describe('ViewComicsComponent', () => {
  let component: ViewComicsComponent;
  let fixture: ComponentFixture<ViewComicsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewComicsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ViewComicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
