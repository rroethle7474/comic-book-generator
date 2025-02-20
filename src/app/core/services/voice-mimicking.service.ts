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
  AudioSnippetResponse
} from '../models/api.models';

export interface RecordingState {
  recordingIndex: number;
  recordings: {
    [key: number]: string | null; // Maps index to audio URL
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

  saveRecording(index: number, audioUrl: string) {
    const currentState = this.recordingState.value;
    this.recordingState.next({
      ...currentState,
      recordings: {
        ...currentState.recordings,
        [index]: audioUrl
      }
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
  uploadAudioSnippet(voiceModelId: string, audioBlob: Blob): Observable<AudioSnippetUploadResponse> {
    const formData = new FormData();
    formData.append('audioFile', audioBlob, 'recording.wav');

    return this.post<AudioSnippetUploadResponse>(
      `voice-mimic/voice-model/${voiceModelId}/audio-snippet`,
      formData
    );
  }

  getAudioSnippets(voiceModelId: string): Observable<AudioSnippetResponse[]> {
    return this.get<AudioSnippetResponse[]>(`voice-mimic/voice-model/${voiceModelId}/audio-snippets`);
  }

  deleteAudioSnippet(audioSnippetId: string): Observable<boolean> {
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
}
