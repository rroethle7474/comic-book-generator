import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environment/environment';
import { ApiResponse } from '../models/api.models';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class ApiBaseService {
  protected baseUrl = environment.apiBaseUrl;

  constructor(
    protected http: HttpClient,
    private toastr: ToastrService
  ) {}

  protected createHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  protected formatErrors(error: HttpErrorResponse): Observable<never> {
    let errorMessage: string;

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = error.error?.message || error.message;

      // Log detailed error information in development
      if (!environment.production) {
        console.error('API Error:', {
          status: error.status,
          message: errorMessage,
          error: error.error
        });
      }
    }

    this.toastr.error(errorMessage, 'Error');
    return throwError(() => ({
      message: errorMessage,
      status: error.status,
      error: error.error
    }));
  }

  protected get<T>(
    endpoint: string,
    params?: HttpParams | { [param: string]: string | string[] }
  ): Observable<T> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, {
      headers: this.createHeaders(),
      params
    }).pipe(
      map(response => this.extractData<T>(response)),
      catchError(error => this.formatErrors(error))
    );
  }

  protected post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, body, {
      headers: this.createHeaders()
    }).pipe(
      map(response => this.extractData<T>(response)),
      tap(response => {
        this.toastr.success('Operation completed successfully', 'Success');
      }),
      catchError(error => this.formatErrors(error))
    );
  }

  protected put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, body, {
      headers: this.createHeaders()
    }).pipe(
      map(response => this.extractData<T>(response)),
      tap(response => {
        this.toastr.success('Update completed successfully', 'Success');
      }),
      catchError(error => this.formatErrors(error))
    );
  }

  protected delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, {
      headers: this.createHeaders()
    }).pipe(
      map(response => this.extractData<T>(response)),
      tap(response => {
        this.toastr.success('Delete completed successfully', 'Success');
      }),
      catchError(error => this.formatErrors(error))
    );
  }

  private extractData<T>(response: any): T {
    // If the response is wrapped in an Ok result
    if (response.result) {
        return response.result as T;
    }

    // Original ApiResponse handling
    if (response.error) {
        this.toastr.error(response.error.message, 'Error');
        throw new Error(response.error.message);
    }
    return response.data as T;
  }

  protected createFormData(file: File, additionalData?: Record<string, any>): FormData {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      });
    }

    return formData;
  }
}
