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

      this.startPolling();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
            case 'IN_PROGRESS':
              this.progressWidth = '50%';
              break;
            case 'COMPLETED':
              this.progressWidth = '100%';
              this.toastr.success('Comic book generation completed!');
              break;
            case 'ERROR':
              this.progressWidth = '0%';
              this.toastr.error('Error generating comic book');
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
