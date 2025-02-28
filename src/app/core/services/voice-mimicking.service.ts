import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { ApiBaseService } from './api-base.service';
import { ToastrService } from 'ngx-toastr';
import {
  CreateVoiceModelRequest,
  CreateVoiceModelResponse,
  VoiceModelListResponse,
  VoiceModelUpdateRequest,
  VoiceModelUpdateResponse,
  AudioSnippetUploadResponse,
  TrainModelResponse,
  AudioSnippetResponse,
  SynthesizeSpeechRequest,
  SynthesizeSpeechResponse,
  HuggingFaceModelResponse,
  StepResponse,
  StepWithRecordingResponse,
  ApiResponse,
  ReplicateModelListResponse
} from '../models/api.models';

export interface RecordingState {
  recordingIndex: number;
  recordings: {
    [key: number]: {
      audioFilePath: string;
      audioSnippetId: string;
    } | null;
  };
}

@Injectable({
  providedIn: 'root'
})
export class VoiceMimickingService extends ApiBaseService {
  currentVoiceModelId = new BehaviorSubject<string | null>(null);
  private recordingState = new BehaviorSubject<RecordingState>({
    recordingIndex: 0,
    recordings: {}
  });

  constructor(http: HttpClient, toastr: ToastrService) {
    super(http, toastr);
  }

  getCurrentVoiceModelId(): Observable<string | null> {
    return this.currentVoiceModelId.asObservable();
  }

  getRecordingState(): Observable<RecordingState> {
    return this.recordingState.asObservable();
  }

  setRecordingIndex(index: number) {
    const currentState = this.recordingState.value;
    this.recordingState.next({
      ...currentState,
      recordingIndex: index
    });
  }

  saveRecording(index: number, recording: { audioFilePath: string; audioSnippetId: string; } | null) {
    const currentState = this.recordingState.value;
    const newRecordings = {
      ...currentState.recordings,
      [index]: recording
    };
    this.recordingState.next({
      ...currentState,
      recordings: newRecordings
    });
  }

  createVoiceModel(request: CreateVoiceModelRequest): Observable<CreateVoiceModelResponse> {
    return this.post<CreateVoiceModelResponse>('voice-mimic/create-voice-model', request)
      .pipe(
        tap(response => {
          console.log('Voice Model created:', response);
          this.currentVoiceModelId.next(response.voiceModelId);
        })
      );
  }

  getVoiceModels(): Observable<CreateVoiceModelResponse[]> {
    return this.get<CreateVoiceModelResponse[]>('/voice-mimic/create-voice-model/get-voice-models');
  }

  getIncompleteVoiceModels(): Observable<VoiceModelListResponse[]> {
    return this.get<VoiceModelListResponse[]>('voice-mimic/incomplete');
  }

  updateVoiceModel(voiceModelId: string, request: VoiceModelUpdateRequest): Observable<VoiceModelUpdateResponse> {
    return this.put<VoiceModelUpdateResponse>(`voice-mimic/${voiceModelId}`, request);
  }

  // Audio recording methods
  uploadAudioSnippet(voiceModelId: string, audioBlob: Blob, stepId: string): Observable<AudioSnippetUploadResponse> {
    const formData = new FormData();
    // Send as webm file - backend should convert to 24kHz WAV for StyleTTS2 compatibility
    formData.append('audioFile', audioBlob, 'recording.webm');
    formData.append('stepId', stepId);
    // Add sample rate information for the backend to use during conversion
    formData.append('targetSampleRate', '24000');

    return this.post<AudioSnippetUploadResponse>(
      `voice-mimic/voice-model/${voiceModelId}/audio-snippet`,
      formData
    ).pipe(
      tap(response => console.log('Upload Response in Service:', response)),
      map(response => {
        if (!response) {
          throw new Error('Invalid response from server');
        }
        return response;
      })
    );
  }

  getAudioSnippets(voiceModelId: string): Observable<AudioSnippetResponse[]> {
    return this.get<AudioSnippetResponse[]>(`voice-mimic/voice-model/${voiceModelId}/audio-snippets`);
  }

  deleteAudioSnippet(audioSnippetId: string): Observable<boolean> {
    return this.delete<boolean>(`voice-mimic/audio-snippet/${audioSnippetId}`);
  }

  // Model training methods
  initiateModelTraining(voiceModelId: string): Observable<TrainModelResponse> {
    return this.post<TrainModelResponse>(`voice-mimic/voice-model/${voiceModelId}/train`, {});
  }

  clearRecordingState() {
    this.recordingState.next({
      recordingIndex: 0,
      recordings: {}
    });
  }

  getVoiceModelProgress(voiceModelId: string): Observable<{
    voiceModelId: string;
    totalSteps: number;
    completedSteps: number;
    steps: {
      stepId: string;
      stepNumber: number;
      transcriptText: string;
      recording?: {
        audioSnippetId: string;
        audioFilePath: string;
        recordedAt: Date;
      };
    }[];
  }> {
    return this.get(`voice-mimic/voice-model/${voiceModelId}/progress`);
  }

  // Add new method to update the entire recording state
  updateRecordingState(state: RecordingState) {
    this.recordingState.next(state);
  }

  // Get all recording steps
  getAllSteps(): Observable<StepResponse[]> {
    return this.get<StepResponse[]>('voice-mimic/steps');
  }

  // Add recording for a specific step
  addAudioSnippetForStep(voiceModelId: string, stepId: string, audioBlob: Blob): Observable<AudioSnippetUploadResponse> {
    const formData = new FormData();
    // Send as webm file - backend should convert to 24kHz WAV for StyleTTS2 compatibility
    formData.append('audioFile', audioBlob, 'recording.webm');
    // Add sample rate information for the backend to use during conversion
    formData.append('targetSampleRate', '24000');

    return this.post<AudioSnippetUploadResponse>(
      `voice-mimic/voice-model/${voiceModelId}/step/${stepId}/recording`,
      formData
    );
  }

  // Get step recordings for a model
  getStepRecordingsForModel(voiceModelId: string): Observable<StepWithRecordingResponse[]> {
    return this.get<StepWithRecordingResponse[]>(`voice-mimic/voice-model/${voiceModelId}/step-recordings`);
  }

  // Synthesize speech with a model
  synthesizeSpeech(voiceModelId: string, text: string): Observable<SynthesizeSpeechResponse> {
    const request: SynthesizeSpeechRequest = {
      textToSynthesize: text
    };

    return this.post<SynthesizeSpeechResponse>(`voice-mimic/synthesize/${voiceModelId}`, request);
  }

  // Get HuggingFace Models
  getHuggingFaceModels(): Observable<HuggingFaceModelResponse[]> {
    return this.get<HuggingFaceModelResponse[]>('voice-mimic/huggingface-models');
  }

  // Delete HuggingFace Model
  deleteHuggingFaceModel(modelName: string): Observable<boolean> {
    return this.delete<boolean>(`voice-mimic/huggingface-model/${modelName}`);
  }

  // Start a recording session
  startRecording(): Observable<{ recordingSessionId: string; message: string }> {
    return this.post<{ recordingSessionId: string; message: string }>('voice-mimic/start-recording', {});
  }

  // Get available Replicate models for voice training
  getAvailableReplicateModels(existingReplicateId?: string): Observable<ReplicateModelListResponse[]> {
    let url = 'voice-mimic/available-voice-training-models';
    if (existingReplicateId) {
      url += `?existingReplicateId=${existingReplicateId}`;
    }
    return this.get<ReplicateModelListResponse[]>(url);
  }
}
