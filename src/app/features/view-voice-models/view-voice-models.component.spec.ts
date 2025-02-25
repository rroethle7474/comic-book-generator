import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewVoiceModelsComponent } from './view-voice-models.component';

describe('ViewVoiceModelsComponent', () => {
  let component: ViewVoiceModelsComponent;
  let fixture: ComponentFixture<ViewVoiceModelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewVoiceModelsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ViewVoiceModelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
