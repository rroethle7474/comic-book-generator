import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ComicBookService } from '../../core/services/comic-book.service';
import { Subject, takeUntil } from 'rxjs';
import { ComicBookListResponse, AssetResponse, CompletedComicResponse } from '../../core/models/api.models';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-view-comics',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './view-comics.component.html',
  styleUrls: ['./view-comics.component.css']
})
export class ViewComicsComponent implements OnInit, OnDestroy {
  activeTab: 'incomplete' | 'completed' = 'incomplete';
  incompleteComics: ComicBookListResponse[] = [];
  completedComics: CompletedComicResponse[] = [];
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private comicBookService: ComicBookService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadIncompleteComics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setActiveTab(tab: 'incomplete' | 'completed'): void {
    this.activeTab = tab;

    if (tab === 'incomplete') {
      this.loadIncompleteComics();
    } else {
      this.loadCompletedComics();
    }
  }

  loadIncompleteComics(): void {
    this.loading = true;
    this.comicBookService.getIncompleteComicBooks()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (comics) => {
          this.incompleteComics = comics;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading incomplete comics:', error);
          this.toastr.error('Failed to load incomplete comics');
          this.loading = false;
        }
      });
  }

  loadCompletedComics(): void {
    this.loading = true;
    this.comicBookService.getCompletedComics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (comics) => {
          this.completedComics = comics;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading completed comics:', error);
          this.toastr.error('Failed to load completed comics');
          this.completedComics = [];
          this.loading = false;
        }
      });
  }

  deleteComic(comicId: string): void {
    this.comicBookService.deleteComicBookWithConfirmation(comicId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (isDeleted) => {
          if (isDeleted) {
            this.toastr.success('Comic book deleted successfully');
            // Reload the appropriate list
            if (this.activeTab === 'incomplete') {
              this.loadIncompleteComics();
            } else {
              this.loadCompletedComics();
            }
          }
        },
        error: (error) => {
          console.error('Error deleting comic book:', error);
          this.toastr.error('Failed to delete comic book');
        }
      });
  }

  truncateDescription(description: string | null): string {
    if (!description) return '';
    return description.length > 25 ? description.substring(0, 25) + '...' : description;
  }
}
