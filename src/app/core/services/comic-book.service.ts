import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
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
  SceneCreateResponse
} from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class ComicBookService extends ApiBaseService {
  private currentComicBookId = new BehaviorSubject<string | null>(null);

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
}
