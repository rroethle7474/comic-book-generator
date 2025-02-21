import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VoiceModelSelectorComponent } from '../../shared/components/voice-model-selector/voice-model-selector.component';
import { VoiceMimickingService } from '../../core/services/voice-mimicking.service';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environment/environment';

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

        // Update recordings and save to service
        this.currentIndex = 0;
        this.recordings = newRecordings;
        this.voiceMimickingService.updateRecordingState({
          recordingIndex: 0,
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
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(blob);

        if (this.selectedModelId) {
          try {
            // Get the response from uploadAudioSnippet
            const response = await this.voiceMimickingService.uploadAudioSnippet(this.selectedModelId, blob).toPromise();
            
            // Create the recording object with both the URL and the snippet ID
            const newRecording = {
              audioFilePath: audioUrl,
              audioSnippetId: response?.audioSnippetId || '' // Make sure this matches your API response
            };

            // Save the recording with both pieces of information
            this.voiceMimickingService.saveRecording(this.currentIndex, newRecording);
            this.recordings[this.currentIndex] = newRecording;
            
            this.toastr.success('Recording saved successfully');
          } catch (error) {
            console.error('Error uploading recording:', error);
            this.toastr.error('Failed to save recording');
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
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      this.isRecording = false;
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
      this.audioElement.src = `${environment.staticAssetsUrl}/${audioPath}`;
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
      await this.voiceMimickingService.initiateModelTraining(this.selectedModelId).toPromise();
      this.toastr.success('Training started successfully');
      // Navigate to a training status page or update UI accordingly
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
}
