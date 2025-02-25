import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, interval, Subscription, switchMap, takeWhile, catchError, throwError, of } from 'rxjs';
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
  AssetType,
  ComicBookStatusResponse,
  AssetDetailsResponse,
  CompletedComicResponse
} from '../models/api.models';
import { ApiResponse } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class ComicBookService extends ApiBaseService {
  currentComicBookId = new BehaviorSubject<string | null>(null);
  private currentScenes = new BehaviorSubject<Map<string, SceneCreateResponse>>(new Map());
  private generationStatusSubject = new BehaviorSubject<string>('PENDING');
  private generationProgressSubject = new BehaviorSubject<number>(0);
  private pollingSubscription: Subscription | null = null;
  private isPolling = false;
  private estimatedTimeSubject = new BehaviorSubject<string | null>(null);
  private statusMessageSubject = new BehaviorSubject<string | null>(null);

  generationStatus$ = this.generationStatusSubject.asObservable();
  generationProgress$ = this.generationProgressSubject.asObservable();
  estimatedTime$ = this.estimatedTimeSubject.asObservable();
  statusMessage$ = this.statusMessageSubject.asObservable();

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
    console.log('Getting asset:', assetId);
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

  // Add this new method
  generateComicBook(assetId: string): Observable<boolean> {
    if (this.isPolling) {
      // Return the existing status if already polling
      return this.generationStatus$.pipe(
        map(status => status !== 'ERROR')
      );
    }

    return this.post<boolean>(`ComicBook/generate/${assetId}`, {}).pipe(
      tap(response => {
        if (response) {
          this.startPolling(assetId);
        }
      })
    );
  }

  generateComicBookPdf(assetId: string): Observable<string> {
    return this.post<string>(`ComicBook/generate-pdf/${assetId}`, {})
      .pipe(
        tap(response => {
          return response;
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  private startPolling(assetId: string) {
    console.log('Starting polling for asset:', assetId);
    if (this.isPolling) return;
    console.log('Starting polling after checking if polling is already in progress for asset:', assetId);
    this.isPolling = true;
    this.pollingSubscription = interval(3000)
      .pipe(
        switchMap(() => this.get<ComicBookStatusResponse>(`ComicBook/status/${assetId}`)),
        takeWhile(response => {
          // Continue polling until we reach a terminal state
          const continuePolling = !['COMPLETED', 'ERROR', 'Failed'].includes(response.status);
          if (!continuePolling) {
            this.stopPolling();
          }
          return continuePolling;
        }, true) // Include the last value
      )
      .subscribe({
        next: (response) => {
          console.log('Received response from polling:', response);
          console.log('Updating generation status:', response.status);
          this.generationStatusSubject.next(response.status);
          this.generationProgressSubject.next(response.progress);
          this.estimatedTimeSubject.next(response.estimatedTimeRemaining || null);
          this.statusMessageSubject.next(response.message || null);
        },
        error: (error) => {
          console.error('Polling error:', error);
          this.generationStatusSubject.next('ERROR');
          this.generationProgressSubject.next(0);
          this.estimatedTimeSubject.next(null);
          this.statusMessageSubject.next('Error checking generation status');
          this.stopPolling();
        }
      });
  }

  getAssetDetails(assetId: string): Observable<AssetDetailsResponse> {
    return this.get<AssetDetailsResponse>(`ComicBook/assets/${assetId}/details`);
  }

  getCompletedComics(): Observable<CompletedComicResponse[]> {
    // This endpoint doesn't exist yet, but this is how we'd call it
    return this.get<CompletedComicResponse[]>('ComicBook/completed')
      .pipe(
        map(response => {
          return response ?? [];
        })
      );
  }

  deleteComicBookWithConfirmation(comicBookId: string): Observable<boolean> {
    // First ask for confirmation with clear warning about data loss
    const confirmed = confirm(
      'Are you sure you want to delete this comic book?\n\n' +
      'This will permanently delete:\n' +
      '- The comic book and all its details\n' +
      '- All scenes and their images\n' +
      '- Any generated PDFs or other assets\n\n' +
      'This action cannot be undone.'
    );

    if (!confirmed) {
      return of(false);
    }

    // If confirmed, proceed with deletion
    return this.delete<ComicBookDeleteResponse>(`ComicBook/${comicBookId}`)
      .pipe(
        map(response => {
          return response.isDeleted;
        }),
        catchError(error => {
          return of(false);
        })
      );
  }

  private stopPolling() {
    console.log('Stopping polling');
    this.isPolling = false;
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }
}
