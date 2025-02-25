import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VoiceMimickingService } from '../../core/services/voice-mimicking.service';
import { Subject, takeUntil } from 'rxjs';
import { HuggingFaceModelResponse } from '../../core/models/api.models';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-view-voice-models',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './view-voice-models.component.html',
  styleUrls: ['./view-voice-models.component.css']
})
export class ViewVoiceModelsComponent implements OnInit, OnDestroy {
  models: HuggingFaceModelResponse[] = [];
  selectedModel: HuggingFaceModelResponse | null = null;
  isLoading = false;
  isDeleting = false;
  isSynthesizing = false;
  audioUrl: string | null = null;
  isPlaying = false;
  synthesisForm: FormGroup;

  private destroy$ = new Subject<void>();
  private audioElement: HTMLAudioElement | null = null;

  constructor(
    private voiceMimickingService: VoiceMimickingService,
    private router: Router,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this.synthesisForm = this.fb.group({
      textToSynthesize: ['Hello, this is a test of my voice model.', [Validators.required, Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.loadModels();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopAudio();
  }

  loadModels(): void {
    this.isLoading = true;
    this.voiceMimickingService.getHuggingFaceModels()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (models) => {
          this.models = models;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading models:', err);
          this.isLoading = false;
          this.toastr.error('Failed to load voice models');
        }
      });
  }

  selectModel(model: HuggingFaceModelResponse): void {
    this.selectedModel = model;
    this.stopAudio();
    this.audioUrl = null;
  }

  deleteModel(model: HuggingFaceModelResponse, event: Event): void {
    event.stopPropagation(); // Prevent selecting the model when clicking delete

    const confirmDelete = confirm(`Are you sure you want to delete the model "${model.name}"?
This action cannot be undone.`);

    if (!confirmDelete) return;

    this.isDeleting = true;
    this.voiceMimickingService.deleteHuggingFaceModel(model.modelId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.models = this.models.filter(m => m.modelId !== model.modelId);
          this.isDeleting = false;
          this.toastr.success(`Model "${model.name}" deleted successfully`);

          if (this.selectedModel?.modelId === model.modelId) {
            this.selectedModel = null;
            this.stopAudio();
            this.audioUrl = null;
          }
        },
        error: (err) => {
          console.error('Error deleting model:', err);
          this.isDeleting = false;
          this.toastr.error('Failed to delete model');
        }
      });
  }

  synthesizeSpeech(): void {
    if (!this.selectedModel) return;

    const text = this.synthesisForm.get('textToSynthesize')?.value;
    if (!text) return;

    this.stopAudio();
    this.audioUrl = null;
    this.isSynthesizing = true;

    // Extract the voice model ID from the HuggingFace model name
    const modelIdMatch = this.selectedModel.modelId.match(/voice-model-([a-zA-Z0-9-]+)/);
    if (!modelIdMatch) {
      this.toastr.error('Could not determine voice model ID');
      this.isSynthesizing = false;
      return;
    }

    const voiceModelId = modelIdMatch[1];

    this.voiceMimickingService.synthesizeSpeech(voiceModelId, text)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.audioUrl = response.audioUrl;
          this.isSynthesizing = false;
          this.toastr.success('Speech synthesized successfully');

          // Auto-play the audio
          setTimeout(() => {
            this.playAudio();
          }, 500);
        },
        error: (err) => {
          console.error('Error synthesizing speech:', err);
          this.isSynthesizing = false;
          this.toastr.error('Failed to synthesize speech');
        }
      });
  }

  playAudio(): void {
    if (!this.audioUrl) return;

    this.stopAudio();

    this.audioElement = new Audio(this.audioUrl);
    this.isPlaying = true;

    this.audioElement.onended = () => {
      this.isPlaying = false;
    };

    this.audioElement.play().catch(err => {
      console.error('Error playing audio:', err);
      this.isPlaying = false;
      this.toastr.error('Failed to play audio');
    });
  }

  stopAudio(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
    this.isPlaying = false;
  }

  createNewVoiceModel(): void {
    this.router.navigate(['/create-voice-model']);
  }

  recordMoreAudio(): void {
    this.router.navigate(['/audio-recording-step']);
  }

  getModelDate(model: HuggingFaceModelResponse): string {
    return new Date(model.lastModified).toLocaleString();
  }

  formatModelId(modelId: string): string {
    // Extract the UUID part from the model ID
    const idMatch = modelId.match(/voice-model-([a-zA-Z0-9-]+)/);
    return idMatch ? idMatch[1].substring(0, 8) + '...' : modelId;
  }
}
