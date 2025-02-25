// view-comic.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ComicBookService } from '../../core/services/comic-book.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { AssetDetailsResponse } from '../../core/models/api.models';

@Component({
  selector: 'app-view-comic',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-comic.component.html',
  styleUrls: ['./view-comic.component.css']
})
export class ViewComicComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  assetId: string | null = null;
  comicBookId: string | null = null;
  assetDetails: AssetDetailsResponse | null = null;
  safeHtml: SafeHtml | null = null;
  isLoading = true;
  pdfUrl: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private comicBookService: ComicBookService,
    private sanitizer: DomSanitizer,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    // Get parameters from route
    this.route.paramMap.subscribe(params => {
      this.assetId = params.get('assetId');

      if (this.assetId) {
        this.loadAssetDetails();
      } else {
        this.toastr.error('Missing asset ID');
        this.isLoading = false;
      }
    });

    // Also check query params for comicBookId
    this.route.queryParams.subscribe(params => {
      this.comicBookId = params['comicBookId'];
    });
  }

  loadAssetDetails() {
    if (!this.assetId) return;

    this.comicBookService.getAssetDetails(this.assetId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          this.assetDetails = details;

          // Sanitize HTML content to safely display it
          if (details.fullStoryText) {
            this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(details.fullStoryText);
          }

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading comic book details:', error);
          this.toastr.error('Failed to load comic book');
          this.isLoading = false;
        }
      });
  }

  generatePdf() {
    if (!this.assetId) return;

    this.comicBookService.generateComicBookPdf(this.assetId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pdfUrl) => {
          this.pdfUrl = pdfUrl;
          window.open(pdfUrl, '_blank');
        },
        error: (error) => {
          console.error('Error generating PDF:', error);
          this.toastr.error('Failed to generate PDF');
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
