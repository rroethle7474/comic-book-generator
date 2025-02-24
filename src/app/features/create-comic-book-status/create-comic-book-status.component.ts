import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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

  private comicBookId: string | null = null;
  private assetId: string | null = null;

  constructor(
    private route: ActivatedRoute,
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
          this.toastr.success('Comic book generation completed!');
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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
