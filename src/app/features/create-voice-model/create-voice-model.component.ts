import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { VoiceMimickingService } from '../../core/services/voice-mimicking.service';
import { CreateVoiceModelRequest, VoiceModelUpdateRequest } from '../../core/models/api.models';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { VoiceModelSelectorComponent } from '../../shared/components/voice-model-selector/voice-model-selector.component';

@Component({
  selector: 'app-create-voice-model',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    VoiceModelSelectorComponent
  ],
  templateUrl: './create-voice-model.component.html',
  styleUrl: './create-voice-model.component.css'
})
export class CreateVoiceModelComponent implements OnInit {
  @ViewChild(VoiceModelSelectorComponent) modelSelector!: VoiceModelSelectorComponent;

  voiceForm!: FormGroup;
  errorMessage = '';
  isLoading = false;
  selectedModelId: string | null = "";
  private originalModelData: { name: string, description: string } | null = null;

  constructor(
    private voiceMimickingService: VoiceMimickingService,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.initForm();
  }

  private initForm() {
    this.voiceForm = this.fb.group({
      voiceModelName: ['', Validators.required],
      voiceModelDescription: ['']
    });
  }

  onModelSelected(modelId: string) {
    console.log('Selected model ID:', modelId);
    this.selectedModelId = modelId;
    this.voiceMimickingService.currentVoiceModelId.next(modelId);

    if (modelId) {
      // Find the selected model
      this.voiceMimickingService.getIncompleteVoiceModels()
        .subscribe({
          next: (models) => {
            const model = models.find(m => m.voiceModelId === modelId);
            if (model) {
              // Store original values
              this.originalModelData = {
                name: model.voiceModelName,
                description: model.voiceModelDescription
              };
              // Populate the form with the selected model's details
              this.voiceForm.patchValue({
                voiceModelName: model.voiceModelName,
                voiceModelDescription: model.voiceModelDescription
              });
            }
          }
        });
    } else {
      // Clear the form and original data for new model
      this.voiceForm.reset();
      this.originalModelData = null;
    }
  }

  onSubmit() {
    if (this.voiceForm.invalid) {
      this.errorMessage = 'Please enter a voice model name.';
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    // If a model is selected, check for updates
    if (this.selectedModelId && this.originalModelData) {
      const currentName = this.voiceForm.get('voiceModelName')?.value;
      const currentDescription = this.voiceForm.get('voiceModelDescription')?.value;

      // Check if there are any changes
      if (currentName !== this.originalModelData.name ||
          currentDescription !== this.originalModelData.description) {

        const updateRequest: VoiceModelUpdateRequest = {
          voiceModelName: currentName,
          voiceModelDescription: currentDescription
        };

        this.voiceMimickingService.updateVoiceModel(this.selectedModelId, updateRequest)
          .subscribe({
            next: (response) => {
              console.log('Updated model:', response);
              this.modelSelector.refreshModels(); // Refresh the selector
              this.router.navigate(['/audio-recording-step']);
            },
            error: (err) => {
              console.error('Error updating voice model:', err);
              this.errorMessage = 'Failed to update voice model. Please try again.';
              this.isLoading = false;
            }
          });
        return;
      }

      // If no changes, just navigate
      this.router.navigate(['/audio-recording-step']);
      return;
    }

    // Create new model
    const request: CreateVoiceModelRequest = {
      voiceModelName: this.voiceForm.get('voiceModelName')?.value,
      voiceModelDescription: this.voiceForm.get('voiceModelDescription')?.value
    };

    this.voiceMimickingService.createVoiceModel(request)
      .subscribe({
        next: (response) => {
          console.log('Created model:', response);
          this.modelSelector.refreshModels(); // Refresh the selector
          this.selectedModelId = response.voiceModelId; // Update selected model
          this.router.navigate(['/audio-recording-step']);
        },
        error: (err) => {
          console.error('Error creating voice model:', err);
          this.errorMessage = 'Failed to create voice model. Please try again.';
          this.isLoading = false;
        }
      });
  }
}
