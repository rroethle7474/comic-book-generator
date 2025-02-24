import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ComicBookService } from '../../core/services/comic-book.service';
import { interval, Subject, takeUntil } from 'rxjs';
import { switchMap } from 'rxjs/operators';
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

  private comicBookId: string | null = null;
  private assetId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private comicBookService: ComicBookService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.comicBookId = params['comicBookId'];
      this.assetId = params['assetId'];

      if (!this.comicBookId || !this.assetId) {
        this.toastr.error('Missing required parameters');
        return;
      }
      // add method to start the generation of the comic book
      this.startGeneration();
      this.startPolling();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private startGeneration() {
    console.log('Starting generation for asset:', this.assetId);
    if (!this.assetId) {
      this.toastr.error('No asset ID available');
      return;
    }

    this.status = 'Starting generation...';
    this.progressWidth = '10%';

    // We'll use the takeUntil operator to handle cleanup if the component is destroyed
    this.comicBookService.generateComicBook(this.assetId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response) {
            this.status = 'Generation started';
            this.progressWidth = '25%';
            // The polling will handle the rest of the status updates
          } else {
            this.status = 'Failed to start generation';
            this.toastr.error('Failed to start comic book generation');
          }
        },
        error: (error) => {
          console.error('Error starting generation:', error);
          this.status = 'Error starting generation';
          this.toastr.error('Failed to start comic book generation');
        }
      });
  }

  private startPolling() {
    if (!this.assetId) return;

    interval(3000)  // Poll every 3 seconds
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.comicBookService.getAsset(this.assetId!))
      )
      .subscribe({
        next: (asset) => {
          this.status = asset.status;

          // Update progress based on status
          switch (asset.status) {
            case 'STARTING':
              this.progressWidth = '25%';
              break;
            case 'GENERATING_IMAGES':
              this.progressWidth = '50%';
              break;
            case 'GENERATING_STORY':
              this.progressWidth = '75%';
              break;
            case 'IN_PROGRESS':
              this.progressWidth = '50%';
              break;
            case 'COMPLETED':
              this.progressWidth = '100%';
              this.toastr.success('Comic book generation completed!');
              this.destroy$.next(); // Stop polling
              break;
            case 'ERROR':
              this.progressWidth = '0%';
              this.toastr.error('Error generating comic book');
              this.destroy$.next(); // Stop polling
              break;
            default:
              this.progressWidth = '25%';
          }
        },
        error: (error) => {
          console.error('Error polling asset status:', error);
          this.toastr.error('Error checking generation status');
        }
      });
  }
}
