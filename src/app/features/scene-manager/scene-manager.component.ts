import { Component, OnInit, Output, EventEmitter, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import {
  IScene,
  ISceneManagerState,
  DEFAULT_SCENE_MANAGER_CONFIG,
  SceneStatus
} from '../../core/models/scene-management.models';
import { Subject, takeUntil } from 'rxjs';
import { ComicBookService } from '../../core/services/comic-book.service';
import { ToastrService } from 'ngx-toastr';
import { SceneCreateRequest } from '../../core/models/api.models';
import { environment } from '../../../environment/environment';

interface ImageValidationConfig {
  maxSizeMB: number;
  allowedTypes: string[];
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
}


@Component({
  selector: 'app-scene-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CdkDrag,
    CdkDropList
  ],
  templateUrl: './scene-manager.component.html',
  styleUrls: ['./scene-manager.component.css']
})
export class SceneManagerComponent implements OnInit {
  @Input() comicBookId?: string;
  @Output() scenesUpdated = new EventEmitter<IScene[]>();
  @Output() validationChange = new EventEmitter<boolean>();
  @Output() scenesValidated = new EventEmitter<{isValid: boolean, scenes: IScene[]}>();
  private destroy$ = new Subject<void>();
  private pendingImageUploads = new Map<string, File>();

  private imageValidationConfig: ImageValidationConfig = {
    maxSizeMB: 5, // 5MB max file size
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    minWidth: 800,
    minHeight: 600,
    maxWidth: 4096,
    maxHeight: 4096
  };

  state: ISceneManagerState = {
    scenes: [],
    isLoading: false,
    dragDisabled: false,
    validationErrors: {}
  };

  config = DEFAULT_SCENE_MANAGER_CONFIG;

  environment = environment;

  constructor(private comicBookService: ComicBookService,
    private toastr: ToastrService) {
    // Initialize with one empty scene
    console.log("ENVIRONMENT", environment.staticAssetsUrl);
    this.addScene();
  }

  ngOnInit() {
    if (this.comicBookId) {
      this.loadExistingScenes();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get canAddScene(): boolean {
    return this.state.scenes.length < this.config.maxScenes;
  }

  get totalScenes(): number {
    return this.state.scenes.length;
  }

  addScene(): void {
    if (this.canAddScene) {
      const newScene: IScene = {
        sceneId: crypto.randomUUID(),
        order: this.state.scenes.length,
        description: '',
        status: SceneStatus.Draft,
        userDescription: '',
        previewUrl: ''
      };
      this.state.scenes = [...this.state.scenes, newScene];
    }
  }

  async onDrop(event: CdkDragDrop<IScene[]>) {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.state.scenes, event.previousIndex, event.currentIndex);

      // Update scene orders
      this.state.scenes = this.state.scenes.map((scene, index) => ({
        ...scene,
        order: index
      }));

      if (this.comicBookId) {
        try {
          await this.comicBookService.updateSceneOrder(
            this.comicBookId,
            this.state.scenes.map(scene => ({
              sceneId: scene.sceneId,
              order: scene.order
            }))
          ).toPromise();
        } catch (error) {
          this.toastr.error('Error updating scene order');
        }
      }

      this.scenesUpdated.emit(this.state.scenes);
    }
  }

  removeScene(sceneId: string): void {
    if (this.state.scenes.length > 1) {
      this.state.scenes = this.state.scenes.filter(scene => scene.sceneId !== sceneId);
      // Reorder remaining scenes
      this.state.scenes = this.state.scenes.map((scene, index) => ({
        ...scene,
        order: index
      }));
    }
  }

  handleDrop(event: DragEvent, scene: IScene): void {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.handleFileSelection(files[0], scene);
    }
  }

  async handleFileSelection(file: File, scene: IScene) {
    const isValid = await this.validateFile(file);
    if (!isValid) return;

    // Store the file for later upload
    this.pendingImageUploads.set(scene.sceneId, file);

    // Create preview and update scene state
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      scene.previewUrl = e.target?.result as string;
      scene.status = SceneStatus.Draft;
      scene.imageFile = file;  // Add this line to track the file in the scene
    };
    reader.readAsDataURL(file);
  }

  async saveScene(scene: IScene): Promise<boolean> {
    try {
      let imagePath = scene.imagePath;

      // Only upload image if it's new or changed
      if (this.pendingImageUploads.has(scene.sceneId)) {
        const file = this.pendingImageUploads.get(scene.sceneId)!;
        imagePath = await this.comicBookService.uploadSceneImage(file)
          .pipe(takeUntil(this.destroy$))
          .toPromise();

        // Clear the pending upload
        this.pendingImageUploads.delete(scene.sceneId);
      }

      const request: SceneCreateRequest = {
        comicBookId: this.comicBookId!,
        sceneOrder: scene.order,
        userDescription: scene.description,
        imagePath
      };

      const response = await this.comicBookService.createScene(request)
        .pipe(takeUntil(this.destroy$))
        .toPromise();

      scene.status = SceneStatus.Complete;
      scene.imagePath = imagePath;

      return true;
    } catch (error) {
      this.toastr.error('Error saving scene');
      return false;
    }
  }

  async saveAllScenes(): Promise<boolean> {
    const results = await Promise.all(
      this.state.scenes.map(scene => this.saveScene(scene))
    );

    return results.every(result => result);
  }

  handleFileBrowse(event: Event, scene: IScene): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (files?.length) {
      this.handleFileSelection(files[0], scene);
    }
  }

  validateScene(scene: IScene): boolean {
    const errors: string[] = [];

    // Check for either a pending upload, existing image, or preview
    const hasImage = this.pendingImageUploads.has(scene.sceneId) ||
                    scene.imagePath ||
                    scene.imageFile ||
                    scene.previewUrl;

    if (!hasImage) {
      errors.push('An image is required');
    }

    if (!scene.description?.trim()) {
      errors.push('Description is required');
    }

    this.state.validationErrors[scene.sceneId] = errors;
    return errors.length === 0;
  }

  validateAllScenes(): boolean {
    let isValid = true;
    this.state.validationErrors = {};

    this.state.scenes.forEach(scene => {
      const sceneErrors: string[] = [];

      // Check for image
      if (!scene.imageFile && !scene.imagePath) {
        sceneErrors.push('An image is required');
      }

      // Check for description
      if (!scene.description?.trim()) {
        sceneErrors.push('Description is required');
      }

      if (sceneErrors.length > 0) {
        this.state.validationErrors[scene.sceneId] = sceneErrors;
        isValid = false;
      }
    });

    // Emit validation state to parent
    this.validationChange.emit(isValid);
    return isValid;
  }

  hasValidationError(sceneId: string, errorMessage: string): boolean {
    return this.state.validationErrors[sceneId]?.includes(errorMessage) || false;
  }

  private async loadExistingScenes() {
    try {
      const scenes = await this.comicBookService.getScenes(this.comicBookId!)
        .pipe(takeUntil(this.destroy$))
        .toPromise();
      console
      if (scenes && scenes.length > 0) {
        this.state.scenes = scenes.map(scene => ({
          sceneId: scene.sceneId,
          order: scene.sceneOrder,
          description: scene.userDescription || '',
          imagePath: scene.imagePath || undefined,
          status: SceneStatus.Complete,
          userDescription: scene.userDescription || '',
          previewUrl: scene.imagePath ? environment.staticAssetsUrl + scene.imagePath : ''
        }));
      }
    } catch (error) {
      this.toastr.error('Error loading scenes');
    }
  }

  private validateFile(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      // Clear any existing validation errors for this scene
      this.state.validationErrors = {};

      // Validate file size
      const maxSizeBytes = this.imageValidationConfig.maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        this.toastr.error(`File size must be less than ${this.imageValidationConfig.maxSizeMB}MB`);
        return resolve(false);
      }

      // Validate file type
      if (!this.imageValidationConfig.allowedTypes.includes(file.type)) {
        this.toastr.error(
          `Invalid file type. Allowed types: ${this.imageValidationConfig.allowedTypes
            .map(type => type.split('/')[1])
            .join(', ')}`
        );
        return resolve(false);
      }

      // Validate image dimensions
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const errors: string[] = [];

        if (img.width < this.imageValidationConfig.minWidth ||
            img.height < this.imageValidationConfig.minHeight) {
          errors.push(
            `Image dimensions too small. Minimum size: ${this.imageValidationConfig.minWidth}x${this.imageValidationConfig.minHeight}px`
          );
        }

        if (img.width > this.imageValidationConfig.maxWidth ||
            img.height > this.imageValidationConfig.maxHeight) {
          errors.push(
            `Image dimensions too large. Maximum size: ${this.imageValidationConfig.maxWidth}x${this.imageValidationConfig.maxHeight}px`
          );
        }

        if (errors.length > 0) {
          errors.forEach(error => this.toastr.error(error));
          resolve(false);
        } else {
          resolve(true);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        this.toastr.error('Error validating image. Please ensure the file is a valid image.');
        resolve(false);
      };

      img.src = objectUrl;
    });
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private emitSceneUpdates() {
    this.scenesUpdated.emit(this.state.scenes);
  }
}
