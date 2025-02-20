import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VoiceModelSelectorComponent } from '../../shared/components/voice-model-selector/voice-model-selector.component';
import { VoiceMimickingService } from '../../core/services/voice-mimicking.service';
import { ToastrService } from 'ngx-toastr';

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
  recordings: { [key: number]: string | null } = {};
  readonly Math = Math;
  protected readonly Object = Object;

  // Sample transcripts (you can replace these with your actual texts)
  transcripts = [
    "Hello! I am testing this voice recording today. Sometimes, I wonder how quickly technology advances. It sure is amazing? I love exploring new AI tools, especially ones that can mimic human speech. Speaking clearly and naturally should help gather accurate training data. Lets see how it turns out!",
    "I can’t believe how excited I feel right now! The sun is setting, painting the sky with brilliant shades of pink and orange. Yet, there’s a bittersweet edge in the air—maybe it’s the chill of approaching autumn. When life moves this quickly, pausing to take everything in can be overwhelming. Do you ever feel that way, too?",
    "On September 14th, 2025, I arrived in New York City at exactly 7:45 p.m. My suitcase weighed forty-two pounds, stuffed with books and souvenirs. During my stay, I discovered local bakeries on 5th Avenue that sold twelve kinds of pastries. Surprisingly, each slice of cake cost only three dollars and fifty cents!",
    "Please read these instructions carefully, then proceed with caution. First, open the large green box labeled ‘Fragile.’ Next, remove the small envelope from inside and place it on the table. Do not bend or fold the papers under any circumstance. Finally, confirm the contents match the checklist and seal the box securely. Your cooperation is greatly appreciated!",
    "Under the moon’s silver glow, a gentle breeze carries whispers across the fields. Shadows dance among the tall grass, swaying to a silent lullaby. Crickets chirp, and distant owls respond with soft, haunting calls. In these hush moments of nighttime, the world feels both vast and quietly intimate."
  ];

  constructor(
    private voiceMimickingService: VoiceMimickingService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    // Check if we have a selected model ID
    this.voiceMimickingService.getCurrentVoiceModelId().subscribe(
      id => {
        if (!id) {
          this.router.navigate(['/create-voice-model']);
          return;
        }
        this.selectedModelId = id;
        this.loadExistingRecordings();
      }
    );

    // Initialize audio element for playback
    this.audioElement = new Audio();
    this.audioElement.onended = () => {
      this.isPlaying = false;
    };

    // Load any existing recording state
    this.voiceMimickingService.getRecordingState().subscribe(state => {
      this.currentIndex = state.recordingIndex;
      this.recordings = state.recordings;
    });
  }

  ngOnDestroy() {
    this.stopRecording();
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
  }

  async loadExistingRecordings() {
    if (!this.selectedModelId) return;

    try {
      console.log("Loading existing recordings", this.selectedModelId);
      const snippets = await this.voiceMimickingService.getAudioSnippets(this.selectedModelId).toPromise();
      console.log("Snippets", snippets);
      if (snippets && snippets.length > 0) {
        // Map the snippets to our recordings object
        snippets.forEach((snippet, index) => {
          this.recordings[index] = snippet.audioFilePath;
        });
      }
    } catch (error) {
      console.error('Error loading existing recordings:', error);
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
            await this.voiceMimickingService.uploadAudioSnippet(this.selectedModelId, blob).toPromise();
            this.voiceMimickingService.saveRecording(this.currentIndex, audioUrl);
            this.recordings[this.currentIndex] = audioUrl;
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
      this.audioElement.src = this.recordings[this.currentIndex] || '';
      this.audioElement.play();
      this.isPlaying = true;
    }
  }

  async deleteRecording() {
    if (!this.selectedModelId || !this.recordings[this.currentIndex]) return;

    try {
      // First, stop any ongoing playback
      if (this.isPlaying) {
        this.audioElement?.pause();
        this.isPlaying = false;
      }

      // Delete the recording from the backend
      await this.voiceMimickingService.deleteAudioSnippet(this.recordings[this.currentIndex] || '').toPromise();

      // Update local state
      delete this.recordings[this.currentIndex];
      this.voiceMimickingService.saveRecording(this.currentIndex, '');

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
      this.voiceMimickingService.setRecordingIndex(this.currentIndex);
    }
  }

  nextRecording() {
    if (this.currentIndex < this.transcripts.length - 1) {
      this.stopPlayback();
      this.currentIndex++;
      this.voiceMimickingService.setRecordingIndex(this.currentIndex);
    }
  }

  private stopPlayback() {
    if (this.isPlaying) {
      this.audioElement?.pause();
      this.isPlaying = false;
    }
  }

  navigateBack() {
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
