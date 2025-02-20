import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudioRecordingStepComponent } from './audio-recording-step.component';

describe('AudioRecordingStepComponent', () => {
  let component: AudioRecordingStepComponent;
  let fixture: ComponentFixture<AudioRecordingStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AudioRecordingStepComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AudioRecordingStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
