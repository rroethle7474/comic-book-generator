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
}

export interface ComicBookCreateResponse {
    comicBookId: string;
    title: string;
}

export interface ComicBookGetResponse {
    comicBookId: string;
    title: string;
    description: string | null;
    scenes: SceneGetResponse[];
}

export interface ComicBookUpdateResponse {
    comicBookId: string;
    title: string;
    description: string | null;
}

export interface ComicBookDeleteResponse {
    comicBookId: string;
    isDeleted: boolean;
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
