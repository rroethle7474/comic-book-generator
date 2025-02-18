import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ComicBookService } from '../../core/services/comic-book.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { SceneCreateRequest } from '../../core/models/api.models';

@Component({
  selector: 'app-comic-book-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './comic-book-create.component.html',
  styleUrls: ['./comic-book-create.component.css'],
  animations: [
    trigger('slideInOut', [
      state('void', style({
        transform: 'translateX(100%)',
        opacity: 0
      })),
      state('*', style({
        transform: 'translateX(0)',
        opacity: 1
      })),
      transition(':enter', [
        animate('300ms ease-in')
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ transform: 'translateX(-100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class ComicBookCreateComponent implements OnInit, OnDestroy {
  comicForm!: FormGroup;
  currentStep = 0;
  totalSteps = 4;
  private destroy$ = new Subject<void>();
  isProcessing = false;

  constructor(
    private fb: FormBuilder,
    private comicBookService: ComicBookService
  ) {
    this.initForm();
  }

  ngOnInit() {
    if (!this.comicForm) {
      this.initForm();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm() {
    this.comicForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      scenes: this.fb.array([])
    });
    this.addScene();
  }

  async nextStep() {
    if (this.isProcessing) return;

    try {
      this.isProcessing = true;

      if (this.currentStep === 0) {
        // Save initial comic book details
        await this.saveComicBookDetails();
      } else if (this.currentStep === 1) {
        // Save first scene
        await this.saveScene(0);
      } else if (this.currentStep === 2) {
        // Save additional scenes
        for (let i = 1; i < this.scenes.length; i++) {
          await this.saveScene(i);
        }
      }

      if (this.currentStep < this.totalSteps - 1) {
        this.currentStep++;
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      // Handle error (show user feedback)
    } finally {
      this.isProcessing = false;
    }
  }

  private async saveComicBookDetails(): Promise<void> {
    if (this.comicForm.get('title')?.valid && this.comicForm.get('description')?.valid) {
      const request = {
        title: this.comicForm.get('title')?.value,
        description: this.comicForm.get('description')?.value
      };

      await this.comicBookService.createInitialComicBook(request).toPromise();
    }
  }

  private async saveScene(index: number): Promise<void> {
    const sceneGroup = this.getSceneFormGroup(index);
    if (sceneGroup.valid) {
      const comicBookId = await this.comicBookService.getCurrentComicBookId()
        .pipe(takeUntil(this.destroy$))
        .toPromise();

      if (!comicBookId) {
        throw new Error('No comic book ID available');
      }

      const request: SceneCreateRequest = {
        comicBookId,
        sceneOrder: index,
        userDescription: sceneGroup.get('description')?.value,
        imagePath: await this.handleImageUpload(sceneGroup.get('image')?.value)
      };

      await this.comicBookService.createScene(request).toPromise();
    }
  }

  private async handleImageUpload(file: File): Promise<string> {
    // TODO: Implement image upload logic
    // This should upload the image to your server and return the path
    return 'temp/path/to/image.jpg';
  }

  get scenes(): FormArray {
    return this.comicForm.get('scenes') as FormArray;
  }

  getSceneFormGroup(index: number): FormGroup {
    return this.scenes.at(index) as FormGroup;
  }

  addScene() {
    if (this.scenes.length < 6) {
      this.scenes.push(this.fb.group({
        image: [null, Validators.required],
        description: ['', Validators.required]
      }));
    }
  }

  removeScene(index: number) {
    if (this.scenes.length > 1) {
      this.scenes.removeAt(index);
    }
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  submit() {
    if (this.comicForm.valid) {
      console.log('Form Submitted:', this.comicForm.value);
      // Stub: Integrate with a service to send data to the backend.
    } else {
      console.log('Form is invalid.');
    }
  }
}
