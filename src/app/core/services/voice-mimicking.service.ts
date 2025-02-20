import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { ApiBaseService } from './api-base.service';
import { ToastrService } from 'ngx-toastr';
import {
  ComicBookCreateRequest,
  ComicBookCreateResponse,
  ComicBookGetResponse,
  ComicBookUpdateRequest,
  ComicBookUpdateResponse,
  ComicBookDeleteResponse,
  SceneCreateRequest,
  SceneCreateResponse,
  ComicBookListResponse,
  SceneUpdateRequest,
  SceneUpdateResponse,
  SceneGetResponse,
  SceneDeleteResponse,
  CreateVoiceModelRequest,
  CreateVoiceModelResponse,
  VoiceModelListResponse,
  VoiceModelUpdateRequest,
  VoiceModelUpdateResponse
} from '../models/api.models';
import { ApiResponse } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class VoiceMimickingService extends ApiBaseService {
  currentVoiceModelId = new BehaviorSubject<string | null>(null);

  constructor(http: HttpClient, toastr: ToastrService) {
    super(http, toastr);
  }

  getCurrentVoiceModelId(): Observable<string | null> {
    return this.currentVoiceModelId.asObservable();
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
}
