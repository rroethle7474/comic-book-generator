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
  AssetCreateRequest,
  AssetUpdateRequest,
  AssetResponse,
  AssetType
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

  // Asset Management Methods
  createAsset(comicBookId: string, request: AssetCreateRequest): Observable<AssetResponse> {
    console.log('Creating asset for comic book:', comicBookId);
    const payload = {
      comicBookId,
      assetType: request.assetType,  // No need to convert, it's already a string
      filePath: request.filePath || '',
      fullStoryText: request.fullStoryText,
      status: request.status || 'IN_PROGRESS',
      pageNumber: request.pageNumber
    };

    console.log('Asset Type:', request.assetType);
    console.log('Full Payload:', payload);

    return this.post<AssetResponse>(`ComicBook/${comicBookId}/assets`, payload);
  }

  getAsset(assetId: string): Observable<AssetResponse> {
    return this.get<AssetResponse>(`ComicBook/assets/${assetId}`);
  }

  updateAsset(assetId: string, request: AssetUpdateRequest): Observable<AssetResponse> {
    return this.put<AssetResponse>(`ComicBook/assets/${assetId}`, request);
  }

  deleteAsset(assetId: string): Observable<boolean> {
    return this.delete<boolean>(`ComicBook/assets/${assetId}`);
  }

  getComicBookAssets(comicBookId: string): Observable<AssetResponse[]> {
    return this.get<AssetResponse[]>(`ComicBook/${comicBookId}/assets`);
  }

  updateAssetStatus(assetId: string, status: string): Observable<AssetResponse> {
    return this.updateAsset(assetId, { status });
  }

  // Helper method to create a styled image asset
  createStyledImageAsset(comicBookId: string, filePath: string): Observable<AssetResponse> {
    return this.createAsset(comicBookId, {
      comicBookId,
      assetType: 'STYLED_IMAGE',  // Use string directly
      filePath,
      status: 'IN_PROGRESS'
    });
  }

  // Helper method to create a full story asset
  createFullStoryAsset(comicBookId: string, storyText: string): Observable<AssetResponse> {
    console.log('Creating full story asset for comic book:', comicBookId);
    return this.createAsset(comicBookId, {
      comicBookId,
      assetType: 'FULL_STORY',  // Use string directly
      filePath: '',
      fullStoryText: storyText,
      status: 'IN_PROGRESS'
    });
  }

  // Helper method to get assets by type
  getAssetsByType(comicBookId: string, assetType: AssetType): Observable<AssetResponse[]> {
    return this.getComicBookAssets(comicBookId).pipe(
      map(assets => assets.filter(asset => asset.assetType === assetType.toString()))
    );
  }

  // Optional: Add method for updating generation status
  updateGenerationStatus(id: string, status: string): Observable<ComicBookUpdateResponse> {
    return this.updateComicBook(id, { generationStatus: status });
  }
}
