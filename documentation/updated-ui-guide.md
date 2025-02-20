# Voice Model Creation and Training API - UI Integration Guide

## Overview

This document outlines the API endpoints and workflow for the voice model creation and training feature. The workflow consists of three main screens:

1. Voice Model Creation Screen - For creating/selecting a voice model
2. Step-based Recording Screen - For recording audio for predefined steps
3. Training Screen - For initiating and monitoring model training

## API Endpoints

### Voice Model Management

```
POST /api/voice-mimic/create-voice-model
```
Creates a new voice model.

**Request Body:**
```json
{
    "voiceModelName": "string",
    "voiceModelDescription": "string"
}
```

**Response:**
```json
{
    "data": {
        "voiceModelId": "guid",
        "voiceModelName": "string",
        "voiceModelDescription": "string"
    }
}
```

### Recording Steps Management

#### Get All Recording Steps
```
GET /api/voice-mimic/steps
```
Retrieves all available recording steps.

**Response:**
```json
{
    "data": [
        {
            "stepId": "guid",
            "stepNumber": 1,
            "transcriptText": "string",
            "createdAt": "datetime",
            "updatedAt": "datetime"
        }
    ]
}
```

#### Get Voice Model Progress
```
GET /api/voice-mimic/voice-model/{voiceModelId}/progress
```
Gets progress and recording status for all steps.

**Response:**
```json
{
    "data": {
        "voiceModelId": "guid",
        "totalSteps": 5,
        "completedSteps": 3,
        "steps": [
            {
                "stepId": "guid",
                "stepNumber": 1,
                "transcriptText": "string",
                "recording": {
                    "audioSnippetId": "guid",
                    "audioFilePath": "string",
                    "recordedAt": "datetime"
                }
            }
        ]
    }
}
```

#### Get Step Recordings
```
GET /api/voice-mimic/voice-model/{voiceModelId}/step-recordings
```
Gets all recordings organized by step.

**Response:**
```json
{
    "data": [
        {
            "stepId": "guid",
            "stepNumber": 1,
            "transcriptText": "string",
            "recording": {
                "audioSnippetId": "guid",
                "audioFilePath": "string",
                "recordedAt": "datetime"
            }
        }
    ]
}
```

#### Add Step Recording
```
POST /api/voice-mimic/voice-model/{voiceModelId}/step/{stepId}/recording
```
Uploads a recording for a specific step.

**Request:**
- Content-Type: multipart/form-data
- Form field: audioFile (file)

**Response:**
```json
{
    "data": {
        "message": "Audio snippet uploaded and associated with step successfully."
    }
}
```

### Model Training

[Previous training endpoints remain unchanged]

## Workflow Implementation Guide

### Screen 1: Voice Model Creation

1. **Initial Setup:**
   - Create a new voice model using `create-voice-model`
   - Store the returned `voiceModelId` for subsequent operations

### Screen 2: Step-based Recording

1. **Load Steps:**
   - Fetch available steps using `GET /steps`
   - Get current progress using `GET /voice-model/{voiceModelId}/progress`

2. **Recording Interface:**
   - Display step transcript for user to read
   - Implement audio recording functionality
   - After each recording:
     - Upload using `voice-model/{voiceModelId}/step/{stepId}/recording`
     - Refresh progress using `voice-model/{voiceModelId}/progress`

3. **Progress Tracking:**
   - Show completion status (e.g., "3 of 5 steps completed")
   - Display which steps have recordings
   - Allow playback of existing recordings
   - Enable re-recording for any step

### Screen 3: Training

[Previous training workflow remains unchanged]

## Error Handling

All endpoints return errors in this format:
```json
{
    "error": {
        "message": "string",
        "code": "string",
        "details": "object"
    }
}
```

Common error codes:
- `AUDIO_FILE_REQUIRED`: No audio file provided
- `AUDIO_SNIPPET_NOT_FOUND`: Audio snippet doesn't exist
- `VOICE_MODEL_NOT_FOUND`: Voice model doesn't exist
- `STEP_NOT_FOUND`: Recording step doesn't exist
- `INVALID_OPERATION`: Invalid action (e.g., training without all required recordings)

## Implementation Notes

1. **Step-based Recording:**
   - Display transcript clearly for user to read
   - Show recording progress/status for each step
   - Enable navigation between steps
   - Consider showing estimated time for each recording

2. **Progress Tracking:**
   - Update progress indicators after each recording
   - Show clear visual indication of completed steps
   - Consider preventing training until all steps are recorded

3. **File Upload:**
   - Audio files should be sent as `multipart/form-data`
   - Consider implementing client-side audio validation
   - Show upload progress indicators

4. **Status Monitoring:**
   - Implement polling for training status (recommended interval: 5-10 seconds)
   - Stop polling once status is "completed" or "failed"

5. **User Experience:**
   - Implement proper loading states for all operations
   - Show confirmation dialogs for re-recording
   - Display clear error messages from API responses
   - Consider implementing retry logic for failed operations

6. **Audio Player:**
   - Implement audio playback for uploaded recordings
   - Use `audioFilePath` from the API response for playback
   - Consider adding waveform visualization

## Required UI Components

1. **Voice Model Creation Screen:**
   - Model creation form
   - Model selection interface (if multiple models exist)

2. **Step-based Recording Screen:**
   - Step progress indicator
   - Transcript display
   - Audio recording interface
   - Recording status for each step
   - Playback functionality
   - Re-record options
   - Navigation between steps

3. **Training Screen:**
   - Training status display
   - Progress indicator
   - Error handling and retry options
   - Completion status

## Next Steps

1. Begin UI implementation with mock data
2. Integrate API endpoints progressively
3. Implement step-based recording workflow
4. Add progress tracking and status updates
5. Implement error handling and loading states
6. Test with various scenarios (success, failure, etc.)

For additional support or API clarification, please reach out to the backend team.