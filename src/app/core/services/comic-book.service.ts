import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';
import {
  ComicBookCreateRequest,
  ComicBookCreateResponse,
  ComicBookGetResponse,
  ComicBookUpdateRequest,
  ComicBookUpdateResponse,
  ComicBookDeleteResponse
} from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class ComicBookService extends ApiBaseService {
  constructor(http: HttpClient) {
    super(http);
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
