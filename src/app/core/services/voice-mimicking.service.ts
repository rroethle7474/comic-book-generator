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
  ApiResponse
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

  // New methods for audio recording
  uploadAudioSnippet(voiceModelId: string, audioBlob: Blob, stepId: string): Observable<AudioSnippetUploadResponse> {
    const formData = new FormData();
    formData.append('audioFile', audioBlob, 'recording.wav');
    formData.append('stepId', stepId);

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
    console.log("DELETE AUDIO SNIPPET", audioSnippetId);
    return this.delete<boolean>(`voice-mimic/audio-snippet/${audioSnippetId}`);
  }

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
}
