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
}

export interface ComicBookUpdateRequest {
    title?: string;
    description?: string;
    isCompleted?: boolean;
}

export interface ComicBookCreateResponse {
    comicBookId: string;
    title: string;
}

export interface ComicBookGetResponse {
    comicBookId: string;
    title: string;
    description: string | null;
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
    isCompleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Scene DTOs
export interface SceneCreateRequest {
    comicBookId: string;
    sceneOrder: number;
    imagePath?: string;
    userDescription?: string;
}

export interface SceneUpdateRequest {
    imagePath?: string;
    userDescription?: string;
    sceneOrder?: number;
    aiGeneratedStory?: string;
}

export interface SceneGetResponse {
    sceneId: string;
    sceneOrder: number;
    imagePath: string | null;
    userDescription: string | null;
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

export interface AudioSnippetUploadResponse {
    message: string;
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
  }

  export interface CreateVoiceModelResponse {
    voiceModelId: string;
    voiceModelName: string;
    voiceModelDescription: string;
  }

export interface VoiceModelListResponse {
  voiceModelId: string;
  voiceModelName: string;
  voiceModelDescription: string;
  isCompleted: boolean;
  trainingDate: Date;
}

export interface VoiceModelUpdateRequest {
  voiceModelName?: string;
  voiceModelDescription?: string;
  isCompleted?: boolean;
}

export interface VoiceModelUpdateResponse {
  voiceModelId: string;
  voiceModelName: string;
  voiceModelDescription: string;
  isCompleted: boolean;
}
