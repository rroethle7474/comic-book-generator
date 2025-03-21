// Base API Response interface for consistent error handling
export interface ApiResponse<T> {
    data?: T;
    error?: {
        message: string;
        code?: string;
        details?: any;
    };
}

// Comic Book DTOs
export interface ComicBookCreateRequest {
    title: string;
    description: string;
    additionalDetails?: string;
}

export interface ComicBookUpdateRequest {
    title?: string;
    description?: string;
    additionalDetails?: string;
    finalComicBookPath?: string;
    generationStatus?: string;
    isCompleted?: boolean;
}

export interface ComicBookCreateResponse {
    comicBookId: string;
    title: string;
    description?: string;
    additionalDetails?: string;
    generationStatus: string;
}

export interface ComicBookGetResponse {
    comicBookId: string;
    title: string;
    description: string | null;
    additionalDetails?: string;
    finalComicBookPath?: string;
    generationStatus: string;
    isCompleted: boolean;
    scenes: SceneGetResponse[];
}

export interface ComicBookUpdateResponse {
    comicBookId: string;
    title: string;
    isCompleted: boolean;
    description: string | null;
}

export interface ComicBookDeleteResponse {
    comicBookId: string;
    isDeleted: boolean;
}

// Comic Book List Response
export interface ComicBookListResponse {
    comicBookId: string;
    title: string;
    description: string;
    additionalDetails?: string;
    finalComicBookPath?: string;
    generationStatus: string;
    isCompleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Scene DTOs
export interface SceneCreateRequest {
    comicBookId: string;
    sceneOrder: number;
    imagePath?: string;
    styledImagePath?: string;
    userDescription?: string;
    dialogueText?: string;
    transitionNotes?: string;
}

export interface SceneUpdateRequest {
    imagePath?: string;
    styledImagePath?: string;
    userDescription?: string;
    dialogueText?: string;
    transitionNotes?: string;
    sceneOrder?: number;
    aiGeneratedStory?: string;
}

export interface SceneGetResponse {
    sceneId: string;
    sceneOrder: number;
    imagePath: string | null;
    styledImagePath: string | null;
    userDescription: string | null;
    dialogueText: string | null;
    transitionNotes: string | null;
    aiGeneratedStory: string | null;
}

export interface SceneCreateResponse {
    sceneId: string;
    sceneOrder: number;
    imagePath?: string;
    userDescription?: string;
}

export interface SceneUpdateResponse extends SceneCreateResponse {
    aiGeneratedStory?: string;
}

export interface SceneDeleteResponse {
    sceneId: string;
    isDeleted: boolean;
}

// Story Generation DTOs
export interface GenerateStoryRequest {
    sceneId: string;
    userDescription: string;
}

export interface GenerateStoryResponse {
    sceneId: string;
    storyTextChunk: string;
    isComplete: boolean;
}

// Voice Mimic DTOs
export interface StartRecordingResponse {
    recordingSessionId: string;
    message: string;
}

export interface AudioSnippetUploadRequest {
    audioFile: File;
    stepIndex: number;
}

export interface AudioSnippetUploadResponse {
    message: string;
    audioSnippetId: string;
}

export interface TrainModelResponse {
    message: string;
}

export interface SynthesizeSpeechRequest {
    textToSynthesize: string;
}

export interface SynthesizeSpeechResponse {
    audioUrl: string;
}

export interface CreateVoiceModelRequest {
  voiceModelName: string;
  voiceModelDescription: string;
  replicateModelId: string;
}

export interface CreateVoiceModelResponse {
  voiceModelId: string;
  voiceModelName: string;
  voiceModelDescription: string;
  replicateModelId?: string;
  replicateModelName?: string;
}

export interface VoiceModelListResponse {
  voiceModelId: string;
  voiceModelName: string;
  voiceModelDescription: string;
  isCompleted: boolean;
  trainingDate: Date;
  replicateModelId: string;
  replicateModelName: string;
}

export interface VoiceModelUpdateRequest {
  voiceModelName?: string;
  voiceModelDescription?: string;
  replicateModelId?: string;
  isCompleted?: boolean;
}

export interface VoiceModelUpdateResponse {
  voiceModelId: string;
  voiceModelName: string;
  voiceModelDescription: string;
  isCompleted: boolean;
}

export interface ReplicateModelListResponse {
  replicateModelId: string;
  replicateModelName: string;
  isCurrentlySelected?: boolean;
}

export interface AudioSnippetResponse {
  audioSnippetId: string;
  audioFilePath: string;
  addedAt: Date;
}

// Add the AssetType enum
export enum AssetType {
  FULL_STORY = 'FULL_STORY',
  STYLED_IMAGE = 'STYLED_IMAGE',
  PDF = 'PDF',
  OTHER = 'OTHER'
}

// Update Asset DTOs
export interface AssetCreateRequest {
    comicBookId: string;
    assetType: string;
    filePath: string;
    fullStoryText?: string;
    status: string;
    pageNumber?: number;
}

export interface AssetUpdateRequest {
    assetType?: string;
    filePath?: string;
    fullStoryText?: string;
    status?: string;
    pageNumber?: number;
}

export interface AssetResponse {
    assetId: string;
    comicBookId: string;
    assetType: string;
    filePath: string;
    fullStoryText?: string;
    status: string;
    pageNumber?: number;
    createdAt: Date;
}

export interface AssetDetailsResponse {
  assetId: string;
  comicBookId: string;
  filePath: string;
  fullStoryText: string | null;
  status: string;
}

export interface ComicBookStatusResponse {
  status: string;
  progress: number;
  estimatedTimeRemaining?: string;
  message?: string;
  assetId?: string;
}

export interface CompletedComicResponse {
  comicBookId: string;
  assetId: string;
  title: string;
  description: string;
  filePath: string;
  completedAt: Date;
}

export interface HuggingFaceModelResponse {
  modelId: string;
  name: string;
  description: string;
  lastModified: Date;
  isLinkedToVoiceModel?: boolean;
  linkedVoiceModelId?: string;
}

// Audio Recording
export interface AudioRecordingDetails {
  audioSnippetId: string;
  audioFilePath: string;
  recordedAt: Date;
}

// Step Response
export interface StepResponse {
  stepId: string;
  stepNumber: number;
  transcriptText: string;
  createdAt: Date;
  updatedAt: Date;
}

// Step with Recording
export interface StepWithRecordingResponse {
  stepId: string;
  stepNumber: number;
  transcriptText: string;
  recording?: AudioRecordingDetails;
}

// Voice Model Progress
export interface VoiceModelStepsProgress {
  voiceModelId: string;
  totalSteps: number;
  completedSteps: number;
  steps: StepWithRecordingResponse[];
}

// Requests for Synthesizing Speech
export interface SynthesizeSpeechRequest {
  textToSynthesize: string;
}
