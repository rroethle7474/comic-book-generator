import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { ComicBookService } from '../../core/services/comic-book.service';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { SceneCreateRequest, ComicBookListResponse } from '../../core/models/api.models';
import { ToastrService } from 'ngx-toastr';
import { SceneManagerComponent } from '../scene-manager/scene-manager.component';
import { IScene } from '../../core/models/scene-management.models';


export interface Step {
  label: string;
  description?: string;
}


@Component({
  selector: 'app-comic-book-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SceneManagerComponent
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
  steps: Step[] = [
    { label: 'Details', description: 'Basic comic book information' },
    { label: 'Scenes', description: 'Add and arrange your scenes' },
    { label: 'Review', description: 'Review and submit' }
  ];

  comicForm!: FormGroup;
  currentStep = 0;
  totalSteps = this.steps.length;
  private destroy$ = new Subject<void>();
  isProcessing = false;
  incompleteComicBooks: ComicBookListResponse[] = [];
  selectedComicBookId = new FormControl('new');
  isDuplicateTitle = false;
  scenesValid = false;
  @ViewChild(SceneManagerComponent)
  sceneManagerComponent!: SceneManagerComponent;

  constructor(
    private fb: FormBuilder,
    private comicBookService: ComicBookService,
    private toastr: ToastrService
  ) {
    this.initForm();
  }

  ngOnInit() {
    if (!this.comicForm) {
      this.initForm();
    }
    this.loadIncompleteComicBooks();

    // Subscribe to title changes
    this.comicForm.get('title')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(title => {
        this.isDuplicateTitle = this.checkDuplicateTitle(title);
      });

    // Set initial dropdown state
    this.updateDropdownState();
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

  private checkDuplicateTitle(title: string): boolean {
    if (!title || this.selectedComicBookId.value !== 'new') {
      return false;
    }

    const normalizedTitle = title.trim().toLowerCase();
    return this.incompleteComicBooks.some(comic =>
      comic.title.trim().toLowerCase() === normalizedTitle
    );
  }

  private updateDropdownState() {
    if (this.currentStep === 0) {
      if (this.selectedComicBookId.disabled) {
        this.selectedComicBookId.enable();
      }
    } else {
      if (this.selectedComicBookId.enabled) {
        this.selectedComicBookId.disable();
      }
    }
  }

  isButtonDisabled(): boolean {
    if (this.currentStep === 0) {
      return !this.comicForm.get('title')?.value ||
             !this.comicForm.get('description')?.value ||
             this.isDuplicateTitle;
    }
    if (this.currentStep === 1) {
      return this.sceneManagerComponent?.state.scenes.length === 0;
    }
    return false;
  }

  handleScenesUpdated(scenes: IScene[]) {
    // Update your form or state as needed
    const scenesArray = this.comicForm.get('scenes') as FormArray;
    scenesArray.clear();

    scenes.forEach(scene => {
      scenesArray.push(this.fb.group({
        image: [scene.imageFile || scene.imagePath],
        description: [scene.description]
      }));
    });
  }

  private async saveComicBookDetails(): Promise<void> {
    if (this.comicForm.get('title')?.valid && this.comicForm.get('description')?.valid) {
      const request = {
        title: this.comicForm.get('title')?.value,
        description: this.comicForm.get('description')?.value
      };

      const response = await this.comicBookService.createInitialComicBook(request).toPromise();
      if (response) {
        // Add the new comic book to the list and select it
        const newComic: ComicBookListResponse = {
          comicBookId: response.comicBookId,
          title: request.title,
          description: request.description,
          isCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.incompleteComicBooks = [...this.incompleteComicBooks, newComic];
        this.selectedComicBookId.setValue(response.comicBookId);
      }
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

  private async saveScenes(scenes: IScene[]): Promise<void> {
    const comicBookId = this.selectedComicBookId.value;
    if (!comicBookId) {
      this.toastr.error('No comic book ID available');
      throw new Error('No comic book ID available');
    }

    // Save all scenes in order
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const request: SceneCreateRequest = {
        comicBookId: comicBookId,
        sceneOrder: i,
        userDescription: scene.description,
        imagePath: scene.imageFile ? await this.handleImageUpload(scene.imageFile) : scene.imagePath
      };

      try {
        await this.comicBookService.createScene(request).toPromise();
      } catch (error) {
        this.toastr.error(`Error saving scene ${i + 1}`);
        throw error;
      }
    }
  }

  async nextStep() {
    if (this.isProcessing) return;

    try {
        this.isProcessing = true;

        if (this.currentStep === 0) {
            if (this.selectedComicBookId.value === 'new') {
                // Check for duplicate title one more time before creating
                if (this.checkDuplicateTitle(this.comicForm.get('title')?.value)) {
                    this.toastr.error('A comic book with this title already exists');
                    return;
                }
                // Save initial comic book details
                await this.saveComicBookDetails();
            } else {
                // Update existing comic book
                const selectedComic = this.incompleteComicBooks.find(
                    comic => comic.comicBookId === this.selectedComicBookId.value
                );

                const currentTitle = this.comicForm.get('title')?.value?.trim();
                const currentDescription = this.comicForm.get('description')?.value?.trim();

                if (selectedComic &&
                    (currentTitle !== selectedComic.title.trim() ||
                     currentDescription !== selectedComic.description.trim())) {
                    const updateRequest = {
                        title: currentTitle,
                        description: currentDescription
                    };
                    await this.comicBookService.updateComicBook(
                        this.selectedComicBookId.value ?? '',
                        updateRequest
                    ).toPromise();
                }
            }

            // Set the comic book ID in the service for subsequent operations
            this.comicBookService.currentComicBookId.next(this.selectedComicBookId.value);
        }
        else if (this.currentStep === 1) {
            const sceneManager = this.sceneManagerComponent;

            if (!sceneManager) {
                this.toastr.error('Scene manager not initialized');
                return;
            }

            if (!this.selectedComicBookId.value) {
                this.toastr.error('No comic book selected');
                return;
            }

            if (!sceneManager.validateAllScenes()) {
                this.toastr.error('Please complete all required fields for at least one scene');
                return;
            }

            // Get existing scenes
            const existingScenes = await this.comicBookService.getScenes(this.selectedComicBookId.value)
                .pipe(takeUntil(this.destroy$))
                .toPromise();

            // Create a map of existing scenes by sceneId for easier lookup
            const existingSceneMap = new Map(existingScenes?.map(scene => [scene.sceneId, scene]));

            // Track which existing scenes are still present
            const processedSceneIds = new Set<string>();

            // Process each current scene
            for (const scene of sceneManager.state.scenes) {
                if (scene.sceneId && existingSceneMap.has(scene.sceneId)) {
                    // Scene exists - check if it needs updating
                    const existingScene = existingSceneMap.get(scene.sceneId)!;
                    processedSceneIds.add(scene.sceneId);

                    // Check if there's a pending image upload for this scene
                    let imagePath = scene.imagePath;
                    if (scene.imageFile) {
                        imagePath = await this.handleImageUpload(scene.imageFile);
                    }

                    if (existingScene.userDescription !== scene.description ||
                        existingScene.imagePath !== imagePath ||
                        existingScene.sceneOrder !== scene.order) {
                        await this.comicBookService.updateScene(scene.sceneId, {
                            userDescription: scene.description,
                            imagePath: imagePath
                        }).toPromise();
                    }
                } else {
                    // Handle image upload first if there's a pending upload
                    let imagePath = scene.imagePath;
                    if (scene.imageFile) {
                        imagePath = await this.handleImageUpload(scene.imageFile);
                    }

                    // Create new scene with the uploaded image path
                    const createResponse = await this.comicBookService.createScene({
                        comicBookId: this.selectedComicBookId.value,
                        sceneOrder: scene.order,
                        userDescription: scene.description,
                        imagePath: imagePath
                    }).toPromise();

                    if (createResponse) {
                        processedSceneIds.add(createResponse.sceneId);
                    }
                }
            }

            // Delete scenes that no longer exist
            if (existingScenes) {
                for (const existingScene of existingScenes) {
                    if (!processedSceneIds.has(existingScene.sceneId)) {
                        await this.comicBookService.deleteScene(
                            this.selectedComicBookId.value,
                            existingScene.sceneId
                        ).toPromise();
                    }
                }
            }
        }

        if (this.currentStep < this.totalSteps - 1) {
            this.currentStep++;
            this.updateDropdownState();
        }
    } catch (error) {
        console.error('Error saving progress:', error);
        this.toastr.error('Error saving progress');
    } finally {
        this.isProcessing = false;
    }
}

  private async handleImageUpload(file: File): Promise<string> {
    try {
      const imagePath = await this.comicBookService.uploadSceneImage(file)
        .pipe(takeUntil(this.destroy$))
        .toPromise();

      if (!imagePath) {
        throw new Error('Failed to upload image');
      }

      return imagePath;
    } catch (error) {
      this.toastr.error('Error uploading image');
      throw error;
    }
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
      this.updateDropdownState();
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

  private loadIncompleteComicBooks() {
    this.comicBookService.getIncompleteComicBooks()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (comics) => {
          this.incompleteComicBooks = comics;
        },
        error: (error) => {
          this.toastr.error('Error retrieving incomplete comic books');
          this.incompleteComicBooks = [];
        }
      });
  }

  onComicBookSelect(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const selectedId = selectElement.value;

    if (selectedId === 'new') {
      this.comicForm.patchValue({
        title: '',
        description: ''
      });
      return;
    }

    const selectedComic = this.incompleteComicBooks.find(comic => comic.comicBookId === selectedId);
    if (selectedComic) {
      this.comicForm.patchValue({
        title: selectedComic.title,
        description: selectedComic.description
      });
    }
  }
}
