import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoiceModelSelectorComponent } from '../../shared/components/voice-model-selector/voice-model-selector.component';
import { VoiceMimickingService } from '../../core/services/voice-mimicking.service';

@Component({
  selector: 'app-audio-recording-step',
  standalone: true,
  imports: [CommonModule, VoiceModelSelectorComponent],
  templateUrl: './audio-recording-step.component.html',
  styleUrl: './audio-recording-step.component.css'
})
export class AudioRecordingStepComponent {
  selectedModelId: string | null = null;

  constructor(private voiceMimickingService: VoiceMimickingService) {
    this.voiceMimickingService.getCurrentVoiceModelId().subscribe(
      id => this.selectedModelId = id
    );
  }

  onModelSelected(modelId: string) {
    // Disabled in this component, so this won't be called
    this.selectedModelId = modelId;
    this.voiceMimickingService.currentVoiceModelId.next(modelId);
  }
}
