// scene-management.models.ts

// Core interface for scene data
export interface IScene {
  sceneId: string;
  order: number;
  description: string;
  imageFile?: File;
  imagePath?: string;
  styledImagePath?: string;
  previewUrl?: string;
  status: SceneStatus;
  userDescription: string;
  dialogueText?: string;
  transitionNotes?: string;
  aiGeneratedStory?: string;
}

// Enum for tracking scene status
export enum SceneStatus {
  Draft = 'draft',
  Uploading = 'uploading',
  Complete = 'complete',
  Error = 'error'
}

// Interface for drag and drop events
export interface ISceneDropEvent {
  previousIndex: number;
  currentIndex: number;
  item: IScene;
}

// Interface for scene validation
export interface ISceneValidation {
  hasImage: boolean;
  hasDescription: boolean;
  isValid: boolean;
  errors: string[];
}

// Interface for scene manager configuration
export interface ISceneManagerConfig {
  maxScenes: number;
  minScenes: number;
  allowedImageTypes: string[];
  maxImageSize: number; // in bytes
  allowReordering: boolean;
}

// Interface for scene upload progress
export interface ISceneUploadProgress {
  sceneId: string;
  progress: number;
  status: SceneStatus;
  error?: string;
}

// Interface for scene manager state
export interface ISceneManagerState {
  scenes: IScene[];
  isLoading: boolean;
  activeSceneId?: string;
  dragDisabled: boolean;
  validationErrors: Record<string, string[]>;
}

// Type for supported image MIME types
export type SupportedImageType = 'image/jpeg' | 'image/png' | 'image/webp';

// Default configuration
export const DEFAULT_SCENE_MANAGER_CONFIG: ISceneManagerConfig = {
  maxScenes: 6,
  minScenes: 1,
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxImageSize: 5 * 1024 * 1024, // 5MB
  allowReordering: true
};

// You might want to add a new interface for assets
export interface IAsset {
  assetId: string;
  comicBookId: string;
  assetType: string;
  filePath: string;
  pageNumber?: number;
  createdAt: Date;
}
