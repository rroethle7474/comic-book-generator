import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewComicComponent } from './view-comic.component';

describe('ViewComicComponent', () => {
  let component: ViewComicComponent;
  let fixture: ComponentFixture<ViewComicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewComicComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ViewComicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
