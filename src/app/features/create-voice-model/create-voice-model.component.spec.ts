import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateVoiceModelComponent } from './create-voice-model.component';

describe('CreateVoiceModelComponent', () => {
  let component: CreateVoiceModelComponent;
  let fixture: ComponentFixture<CreateVoiceModelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateVoiceModelComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateVoiceModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
