import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ComicBookService } from '../../core/services/comic-book.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-create-comic-book-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './create-comic-book-status.component.html',
  styleUrls: ['./create-comic-book-status.component.css']
})
export class CreateComicBookStatusComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  status: string = 'Initializing...';
  progressWidth: string = '0%';
  estimatedTime: string | null = null;
  statusMessage: string | null = null;
  isGenerationComplete: boolean = false;

  private comicBookId: string | null = null;
  private assetId: string | null = null;
  private finalAssetUrl: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private comicBookService: ComicBookService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    // Subscribe to query params
    this.route.queryParams.subscribe(params => {
      this.comicBookId = params['comicBookId'];
      this.assetId = params['assetId'];

      if (!this.comicBookId || !this.assetId) {
        this.toastr.error('Missing required parameters');
        return;
      }

      // Start generation and subscribe to status updates
      this.startGeneration();
      this.subscribeToGenerationUpdates();
    });
  }

  private startGeneration() {
    if (!this.assetId) return;

    this.comicBookService.generateComicBook(this.assetId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (error) => {
          console.error('Error starting generation:', error);
          this.toastr.error('Failed to start comic book generation');
        }
      });
  }

  private subscribeToGenerationUpdates() {
    // Subscribe to status updates
    this.comicBookService.generationStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.status = status;

        if (status === 'COMPLETED') {
          this.isGenerationComplete = true;
          this.toastr.success('Comic book generation completed!');
          // Fetch the asset details to get the URL
          this.fetchAssetDetails();
        } else if (status === 'ERROR' || status === 'Failed') {
          this.toastr.error('Error generating comic book');
        }
      });

    // Subscribe to progress updates
    this.comicBookService.generationProgress$
      .pipe(takeUntil(this.destroy$))
      .subscribe(progress => {
        this.progressWidth = `${progress}%`;
      });

    // New estimated time subscription
    this.comicBookService.estimatedTime$
      .pipe(takeUntil(this.destroy$))
      .subscribe(time => {
        this.estimatedTime = time;
      });

    // New status message subscription
    this.comicBookService.statusMessage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        this.statusMessage = message;
        if (message) {
          this.toastr.info(message);
        }
      });
  }

  // Fetch asset details when generation is complete
  private fetchAssetDetails() {
    if (!this.assetId) return;

    this.comicBookService.getAsset(this.assetId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (asset) => {
          this.finalAssetUrl = asset.filePath;
        },
        error: (error) => {
          console.error('Error fetching asset details:', error);
          this.toastr.error('Error retrieving comic book details');
        }
      });
  }

  // View the generated comic
  viewComic() {
    if (this.assetId) {
      this.router.navigate(['/view-comic', this.assetId], {
        queryParams: {
          comicBookId: this.comicBookId
        }
      });
    }
  }

  // Generate PDF of the comic
  generatePdf() {
    if (!this.assetId) {
      this.toastr.error('Comic asset ID is missing');
      return;
    }

    this.comicBookService.generateComicBookPdf(this.assetId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pdfUrl) => {
          if (pdfUrl) {
            // If the API returns a URL, open it in a new tab
            window.open(pdfUrl, '_blank');
          } else {
            this.toastr.success('PDF generation initiated. It will be available shortly.');
          }
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
