import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { ComicBookService } from '../../core/services/comic-book.service';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { SceneCreateRequest, ComicBookListResponse, SceneUpdateRequest, AssetType } from '../../core/models/api.models';
import { ToastrService } from 'ngx-toastr';
import { SceneManagerComponent } from '../scene-manager/scene-manager.component';
import { IScene, SceneStatus } from '../../core/models/scene-management.models';
import { environment } from '../../../environment/environment';
import { Router } from '@angular/router';


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
  staticAssetsUrl = environment.staticAssetsUrl;
  sceneCount = 0;

  constructor(
    private fb: FormBuilder,
    private comicBookService: ComicBookService,
    private toastr: ToastrService,
    private router: Router
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
      additionalDetails: [''],
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
          generationStatus: "pending",
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
    try {
        // Get existing scenes first
        console.log("ITS TIME");
        const existingScenes = await this.comicBookService.getScenes(this.selectedComicBookId.value!)
            .pipe(takeUntil(this.destroy$))
            .toPromise();

        // Create a map of existing scenes by sceneId for easier lookup
        const existingSceneMap = new Map(existingScenes?.map(scene => [scene.sceneId, scene]));

        // Track which scenes are still present
        const processedSceneIds = new Set<string>();

        // Process each scene
        for (const scene of scenes) {
            // Handle image upload first if there's a pending upload
            let imagePath = scene.imagePath;
            if (scene.imageFile) {
                imagePath = await this.handleImageUpload(scene.imageFile);
            }

            if (scene.sceneId && existingSceneMap.has(scene.sceneId)) {
                // Scene exists - check if it needs updating
                const existingScene = existingSceneMap.get(scene.sceneId)!;
                processedSceneIds.add(scene.sceneId);

                // Update if any properties have changed
                if (existingScene.userDescription !== scene.description ||
                    existingScene.imagePath !== imagePath ||
                    existingScene.sceneOrder !== scene.order) {
                    let sceneUpdateRequest: SceneUpdateRequest = {
                      userDescription: scene.description,
                      imagePath: imagePath,
                      sceneOrder: scene.order
                    };
                    await this.comicBookService.updateScene(this.selectedComicBookId.value || "" , scene.sceneId, sceneUpdateRequest).toPromise();
                }
            } else {
                // Create new scene
                const createResponse = await this.comicBookService.createScene({
                    comicBookId: this.selectedComicBookId.value || "",
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
                        this.selectedComicBookId.value!,
                        existingScene.sceneId
                    ).toPromise();
                }
            }
        }

        // Store the scene count after successful save
        this.sceneCount = scenes.length;

    } catch (error) {
        this.toastr.error('Error saving scenes');
        throw error;
    }
  }

  async nextStep() {
    if (this.isProcessing) return;

    try {
        this.isProcessing = true;

        if (this.currentStep === 0) {
            if (this.selectedComicBookId.value === 'new') {
                if (this.checkDuplicateTitle(this.comicForm.get('title')?.value)) {
                    this.toastr.error('A comic book with this title already exists');
                    return;
                }
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

                    // Update the comic in the incompleteComicBooks array
                    this.incompleteComicBooks = this.incompleteComicBooks.map(comic => {
                        if (comic.comicBookId === this.selectedComicBookId.value) {
                            return {
                                ...comic,
                                title: currentTitle,
                                description: currentDescription,
                                updatedAt: new Date()
                            };
                        }
                        return comic;
                    });
                }
            }

            this.comicBookService.currentComicBookId.next(this.selectedComicBookId.value);
            this.currentStep++;
            this.updateDropdownState();
        }
        else if (this.currentStep === 1) {
            const sceneManager = this.sceneManagerComponent;

            if (!sceneManager || !this.selectedComicBookId.value) {
                this.toastr.error('Scene manager not initialized or no comic book selected');
                return;
            }

            if (!sceneManager.validateAllScenes()) {
                this.toastr.error('Please complete all required fields for at least one scene');
                return;
            }

            // Save scenes and wait for completion
            await this.saveScenes(sceneManager.state.scenes);

            // Only proceed after data is loaded
            this.currentStep++;
            this.updateDropdownState();
        }
    } catch (error) {
        console.error('Error during step transition:', error);
        this.toastr.error('Error transitioning to next step');
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

  async submit() {
    if (!this.selectedComicBookId.value) {
      this.toastr.error('No comic book selected');
      return;
    }

    try {
      this.isProcessing = true;

      // Save additional details to the comic book record
      const additionalDetails = this.comicForm.get('additionalDetails')?.value;
      await this.comicBookService.updateComicBook(
        this.selectedComicBookId.value,
        { additionalDetails }
      ).toPromise();

      // First check if there's an existing asset
      const existingAssets = await this.comicBookService.getAssetsByType(
        this.selectedComicBookId.value,
        AssetType.FULL_STORY
      ).toPromise();

      let assetId: string;

      if (existingAssets && existingAssets.length > 0) {
        // Use existing asset
        assetId = existingAssets[0].assetId;
        // Update status to IN_PROGRESS
        await this.comicBookService.updateAssetStatus(assetId, 'IN_PROGRESS').toPromise();
      } else {
        // Create new asset
        const response = await this.comicBookService.createFullStoryAsset(
          this.selectedComicBookId.value,
          ''  // Empty initial story text
        ).toPromise();

        if (!response) {
          throw new Error('Failed to create asset');
        }

        assetId = response.assetId;
      }

      // Navigate to status page with both IDs
      this.router.navigate(['/create-comic-book-status'], {
        queryParams: {
          comicBookId: this.selectedComicBookId.value,
          assetId: assetId
        }
      });

    } catch (error) {
      console.error('Error submitting comic book:', error);
      this.toastr.error('Failed to submit comic book');
    } finally {
      this.isProcessing = false;
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
        description: '',
        additionalDetails: ''
      });
      return;
    }

    const selectedComic = this.incompleteComicBooks.find(comic => comic.comicBookId === selectedId);
    if (selectedComic) {
      this.comicForm.patchValue({
        title: selectedComic.title,
        description: selectedComic.description,
        additionalDetails: selectedComic.additionalDetails || ''
      });
    }
  }

  async generateFullStory() {
    if (!this.selectedComicBookId.value) return;

    try {
      this.isProcessing = true;

      // Assuming you have a method to generate the story text
      const storyText = "This is a test story"; //await this.generateStoryText();

      // Create a full story asset
      await this.comicBookService.createFullStoryAsset(
        this.selectedComicBookId.value,
        storyText
      ).toPromise();

      this.toastr.success('Story generated successfully');
    } catch (error) {
      this.toastr.error('Error generating story');
      console.error(error);
    } finally {
      this.isProcessing = false;
    }
  }

  async checkAssetStatus(assetId: string): Promise<void> {
    try {
      const asset = await this.comicBookService.getAsset(assetId).toPromise();
      if (asset?.status === 'COMPLETED') {
        // Handle completion
        this.toastr.success('Asset generation completed');
      } else if (asset?.status === 'ERROR') {
        this.toastr.error('Asset generation failed');
      }
    } catch (error) {
      console.error('Error checking asset status:', error);
    }
  }
}
