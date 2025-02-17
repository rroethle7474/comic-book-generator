import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComicBookCreateComponent } from './comic-book-create.component';

describe('ComicBookCreateComponent', () => {
  let component: ComicBookCreateComponent;
  let fixture: ComponentFixture<ComicBookCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComicBookCreateComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ComicBookCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
