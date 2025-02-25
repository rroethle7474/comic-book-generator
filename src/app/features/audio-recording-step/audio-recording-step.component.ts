import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VoiceModelSelectorComponent } from '../../shared/components/voice-model-selector/voice-model-selector.component';
import { VoiceMimickingService } from '../../core/services/voice-mimicking.service';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environment/environment';

interface Step {
  stepId: string;
  stepNumber: number;
  transcriptText: string;
  recording?: {
    audioSnippetId: string;
    audioFilePath: string;
    recordedAt: Date;
  };
}

@Component({
  selector: 'app-audio-recording-step',
  standalone: true,
  imports: [CommonModule, VoiceModelSelectorComponent],
  templateUrl: './audio-recording-step.component.html',
  styleUrls: ['./audio-recording-step.component.css']
})
export class AudioRecordingStepComponent implements OnInit, OnDestroy {
  selectedModelId: string | null = null;
  currentIndex = 0;
  isRecording = false;
  isPlaying = false;
  isTraining = false;
  isTrainingComplete = false;
  mediaRecorder: MediaRecorder | null = null;
  audioElement: HTMLAudioElement | null = null;
  recordings: {
    [key: number]: {
      audioFilePath: string;
      audioSnippetId: string;
    } | null
  } = {};
  readonly Math = Math;
  protected readonly Object = Object;

  // Replace hardcoded transcripts with empty array
  transcripts: string[] = [];

  // Add new property to store steps
  steps: Step[] = [];

  constructor(
    private voiceMimickingService: VoiceMimickingService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    // Reset current index at component initialization
    this.currentIndex = 0;

    this.voiceMimickingService.getCurrentVoiceModelId().subscribe(
      id => {
        if (!id) {
          this.router.navigate(['/create-voice-model']);
          return;
        }
        this.selectedModelId = id;
        // Clear any existing recordings state before loading new model
        this.recordings = {};
        this.voiceMimickingService.clearRecordingState();
        this.loadStepsAndRecordings();
      }
    );

    // Initialize audio element for playback
    this.audioElement = new Audio();
    this.audioElement.onended = () => {
      this.isPlaying = false;
    };

    // Subscribe to recording state changes
    this.voiceMimickingService.getRecordingState().subscribe(state => {
      console.log("Recording State Updated:", state);
      // Only update if we don't already have recordings loaded
      if (Object.keys(this.recordings).length === 0) {
        this.currentIndex = state.recordingIndex;
        this.recordings = state.recordings;
      }
    });
  }

  ngOnDestroy() {
    this.stopRecording();
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
  }

  async loadStepsAndRecordings() {
    if (!this.selectedModelId) return;

    try {
      const progress = await this.voiceMimickingService.getVoiceModelProgress(this.selectedModelId).toPromise();
      console.log("Loaded Progress:", progress);

      if (progress) {
        this.steps = progress.steps;
        this.transcripts = progress.steps.map(step => step.transcriptText);

        // Create a new recordings object
        const newRecordings: typeof this.recordings = {};

        // Map recordings to their correct steps
        progress.steps.forEach((step, index) => {
          if (step.recording) {
            newRecordings[index] = {
              audioFilePath: step.recording.audioFilePath,
              audioSnippetId: step.recording.audioSnippetId
            };
          }
        });

        // Update recordings but maintain current index
        const currentIndex = this.currentIndex;
        this.recordings = newRecordings;
        this.voiceMimickingService.updateRecordingState({
          recordingIndex: currentIndex,
          recordings: newRecordings
        });

        console.log("Updated Recordings State:", this.recordings);
      }
    } catch (error) {
      console.error('Error loading steps and recordings:', error);
      this.toastr.error('Failed to load voice model data');
    }
  }

  get allRecordingsComplete(): boolean {
    return Object.keys(this.recordings).length === this.transcripts.length;
  }

  async toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  private async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      this.mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      this.mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: 'audio/wav' });
          console.log('Created audio blob:', blob);

          if (!this.selectedModelId) {
            throw new Error('No voice model selected');
          }

          // Get the current step's ID
          const currentStep = this.steps[this.currentIndex];
          if (!currentStep?.stepId) {
            throw new Error('No step ID found for current index');
          }

          // Upload the recording with the stepId
          const response = await this.voiceMimickingService.uploadAudioSnippet(
            this.selectedModelId,
            blob,
            currentStep.stepId
          ).toPromise();

          console.log('Upload Response in Component:', response);

          if (!response?.audioSnippetId) {
            throw new Error('Invalid response from server: missing audioSnippetId');
          }

          // Create the recording object with the file path from the server response
          const newRecording = {
            audioFilePath: `/uploads/audio/${response.audioSnippetId}_recording.wav`,
            audioSnippetId: response.audioSnippetId
          };

          console.log('New Recording Object:', newRecording);

          // Update both local and service state
          this.recordings[this.currentIndex] = newRecording;
          this.voiceMimickingService.saveRecording(this.currentIndex, newRecording);

          // Refresh the steps data to get the latest state
          await this.loadStepsAndRecordings();

          this.toastr.success('Recording saved successfully');
        } catch (error) {
          console.error('Error in onstop handler:', error);
          this.toastr.error(error instanceof Error ? error.message : 'Failed to save recording');
        } finally {
          // Clean up the media stream
          if (this.mediaRecorder?.stream) {
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
          }
        }
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.toastr.info('Recording started');
    } catch (err) {
      console.error('Error accessing microphone:', err);
      this.toastr.error('Could not access microphone');
    }
  }

  private stopRecording() {
    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        console.log('Stopping recording...');
        this.mediaRecorder.stop();
        this.isRecording = false;
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      this.toastr.error('Error stopping recording');
    }
  }

  playRecording() {
    if (!this.audioElement || !this.recordings[this.currentIndex]) return;

    if (this.isPlaying) {
      this.audioElement.pause();
      this.isPlaying = false;
    } else {
      const recording = this.recordings[this.currentIndex];
      if (!recording) return;

      const audioPath = recording.audioFilePath;
      console.log("AUDIO PATH", audioPath);

      // Check if this is a blob URL (new recording) or a file path (existing recording)
      if (audioPath.startsWith('blob:')) {
        this.audioElement.src = audioPath;
      } else {
        this.audioElement.src = `${environment.staticAssetsUrl}/${audioPath}`;
      }

      this.audioElement.play();
      this.isPlaying = true;
    }
  }

  async deleteRecording() {
    if (!this.selectedModelId || !this.recordings[this.currentIndex]) return;

    try {
      if (this.isPlaying) {
        this.audioElement?.pause();
        this.isPlaying = false;
      }

      const recording = this.recordings[this.currentIndex];
      if (!recording) return;

      console.log("Deleting recording:", recording);

      // Delete the recording from the backend using the audioSnippetId
      await this.voiceMimickingService.deleteAudioSnippet(recording.audioSnippetId).toPromise();

      // Update local state
      delete this.recordings[this.currentIndex];
      this.voiceMimickingService.saveRecording(this.currentIndex, null);

      this.toastr.success('Recording deleted successfully');
    } catch (error) {
      console.error('Error deleting recording:', error);
      this.toastr.error('Failed to delete recording');
    }
  }

  previousRecording() {
    if (this.currentIndex > 0) {
      this.stopPlayback();
      this.currentIndex--;
      this.voiceMimickingService.updateRecordingState({
        recordingIndex: this.currentIndex,
        recordings: this.recordings
      });
    }
  }

  nextRecording() {
    if (this.currentIndex < this.transcripts.length - 1) {
      this.stopPlayback();
      this.currentIndex++;
      this.voiceMimickingService.updateRecordingState({
        recordingIndex: this.currentIndex,
        recordings: this.recordings
      });
    }
  }

  private stopPlayback() {
    if (this.isPlaying) {
      this.audioElement?.pause();
      this.isPlaying = false;
    }
  }

  navigateBack() {
    // Clear the recording state before navigating back
    this.voiceMimickingService.clearRecordingState();
    this.router.navigate(['/create-voice-model']);
  }

  async startTraining() {
    if (!this.selectedModelId || !this.allRecordingsComplete) return;

    try {
      this.isTraining = true;
      this.toastr.info('Initiating model training. This may take a few minutes...');

      // Initiate the training process
      const response = await this.voiceMimickingService.initiateModelTraining(this.selectedModelId).toPromise();

      // Mark the model as completed
      await this.voiceMimickingService.updateVoiceModel(
        this.selectedModelId,
        { isCompleted: true }
      ).toPromise();

      this.toastr.success('Training started successfully. Your voice model will be ready shortly.');

      // Navigate to the voice model view to see the trained model
      this.router.navigate(['/view-voice-model']);
    } catch (error) {
      console.error('Error starting training:', error);
      this.toastr.error('Failed to start training');
    } finally {
      this.isTraining = false;
    }
  }

  onModelSelected(modelId: string) {
    // Disabled in this component, so this won't be called
    this.selectedModelId = modelId;
  }

// Add this method to the component class
viewTrainedModel() {
  this.router.navigate(['/view-voice-model']);
}
}
