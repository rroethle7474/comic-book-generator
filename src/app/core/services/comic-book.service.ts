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
  SceneDeleteResponse
} from '../models/api.models';
import { ApiResponse } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class ComicBookService extends ApiBaseService {
  currentComicBookId = new BehaviorSubject<string | null>(null);
  private currentScenes = new BehaviorSubject<Map<string, SceneCreateResponse>>(new Map());

  constructor(http: HttpClient, toastr: ToastrService) {
    super(http, toastr);
  }

  getCurrentComicBookId(): Observable<string | null> {
    return this.currentComicBookId.asObservable();
  }

  createInitialComicBook(request: ComicBookCreateRequest): Observable<ComicBookCreateResponse> {
    return this.post<ComicBookCreateResponse>('ComicBook/create', request)
      .pipe(
        tap(response => {
          console.log('Comic book created:', response);
          this.currentComicBookId.next(response.comicBookId);
        })
      );
  }

  createScene(request: SceneCreateRequest): Observable<SceneCreateResponse> {
    const comicBookId = this.currentComicBookId.value;
    if (!comicBookId) {
      throw new Error('No comic book ID available');
    }
    return this.post<SceneCreateResponse>(`ComicBook/${comicBookId}/scene`, request);
  }

  createComicBook(request: ComicBookCreateRequest): Observable<ComicBookCreateResponse> {
    return this.post<ComicBookCreateResponse>('ComicBook/create', request);
  }

  getComicBook(id: string): Observable<ComicBookGetResponse> {
    return this.get<ComicBookGetResponse>(`ComicBook/${id}`);
  }

  updateComicBook(id: string, request: ComicBookUpdateRequest): Observable<ComicBookUpdateResponse> {
    return this.put<ComicBookUpdateResponse>(`ComicBook/${id}`, request);
  }

  deleteComicBook(id: string): Observable<ComicBookDeleteResponse> {
    return this.delete<ComicBookDeleteResponse>(`ComicBook/${id}`);
  }

  getIncompleteComicBooks(): Observable<ComicBookListResponse[]> {
    return this.get<ComicBookListResponse[]>(`ComicBook/incomplete`)
      .pipe(
        map(response => {
          return response ?? [];
        })
      );
  }

  uploadSceneImage(file: File): Observable<string> {
    const formData = this.createFormData(file);
    return this.post<{ imagePath: string }>('ComicBook/upload/scene-image', formData)
      .pipe(map(response => response.imagePath));
  }

  // Method to store current scenes in memory
  setCurrentScenes(scenes: SceneCreateResponse[]) {
    const sceneMap = new Map();
    scenes.forEach(scene => sceneMap.set(scene.sceneId, scene));
    this.currentScenes.next(sceneMap);
  }

  getCurrentScenes(): Observable<Map<string, SceneCreateResponse>> {
    return this.currentScenes.asObservable();
  }

  // Method to update a single scene
  updateScene(comicBookId: string, sceneId: string, request: SceneUpdateRequest): Observable<SceneUpdateResponse> {
    return this.put<SceneUpdateResponse>(`ComicBook/${comicBookId}/scene/${sceneId}`, request);
  }

  // Method to get scenes for a comic book
  getScenes(comicBookId: string): Observable<SceneGetResponse[]> {
    return this.get<SceneGetResponse[]>(`ComicBook/${comicBookId}/scenes`);
  }

  deleteScene(comicBookId: string, sceneId: string): Observable<SceneDeleteResponse> {
    return this.delete<SceneDeleteResponse>(`ComicBook/${comicBookId}/scene/${sceneId}`);
  }
}
