Voice Mimicking API Integration Guide
This document outlines how to integrate with the Voice Mimicking API endpoints to manage voice models, train models with audio samples, and generate speech.
Table of Contents

Authentication
Voice Model Management
Audio Recording and Processing
Model Training
Speech Synthesis
HuggingFace Model Management
Error Handling

Authentication
All requests should include appropriate authentication headers based on your API configuration.
Voice Model Management
Create a Voice Model
Creates a new voice model in the system.
Endpoint: POST /api/voice-mimic/create-voice-model
Request Body:
jsonCopy{
  "voiceModelName": "My Voice Model",
  "voiceModelDescription": "A brief description of this voice model"
}
Response:
jsonCopy{
  "data": {
    "voiceModelId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "voiceModelName": "My Voice Model",
    "voiceModelDescription": "A brief description of this voice model"
  },
  "error": null
}
Update a Voice Model
Updates an existing voice model's properties.
Endpoint: PUT /api/voice-mimic/{voiceModelId}
Request Body:
jsonCopy{
  "voiceModelName": "Updated Voice Model Name",
  "voiceModelDescription": "Updated description",
  "isCompleted": false
}
Response:
jsonCopy{
  "data": {
    "voiceModelId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "voiceModelName": "Updated Voice Model Name",
    "voiceModelDescription": "Updated description",
    "isCompleted": false,
    "trainingDate": "2023-02-25T12:00:00Z"
  },
  "error": null
}
Get Incomplete Voice Models
Returns all voice models that are still in progress (not marked as completed).
Endpoint: GET /api/voice-mimic/incomplete
Response:
jsonCopy{
  "data": [
    {
      "voiceModelId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "voiceModelName": "My Voice Model",
      "voiceModelDescription": "A description of this voice model",
      "isCompleted": false,
      "trainingDate": "2023-02-25T12:00:00Z"
    }
  ],
  "error": null
}
Audio Recording and Processing
Upload Audio Snippet for a Model
Uploads an audio recording for a specific voice model and step.
Endpoint: POST /api/voice-mimic/voice-model/{voiceModelId}/audio-snippet
Form Data:
CopyaudioFile: [binary file data]
stepId: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
Response:
jsonCopy{
  "data": {
    "message": "Audio snippet uploaded and associated with voice model successfully.",
    "audioSnippetId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "error": null
}
Get Audio Snippets for a Model
Retrieves all audio snippets associated with a voice model.
Endpoint: GET /api/voice-mimic/voice-model/{voiceModelId}/audio-snippets
Response:
jsonCopy{
  "data": [
    {
      "audioSnippetId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "audioFilePath": "/uploads/audio/3fa85f64-5717-4562-b3fc-2c963f66afa6.wav",
      "addedAt": "2023-02-25T12:00:00Z"
    }
  ],
  "error": null
}
Delete Audio Snippet
Removes an audio snippet from the system.
Endpoint: DELETE /api/voice-mimic/audio-snippet/{audioSnippetId}
Response:
jsonCopy{
  "data": true,
  "error": null
}
Model Training
Get Recording Steps
Retrieves all available recording steps (prompts for voice recording).
Endpoint: GET /api/voice-mimic/steps
Response:
jsonCopy{
  "data": [
    {
      "stepId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "stepNumber": 1,
      "transcriptText": "The quick brown fox jumps over the lazy dog.",
      "createdAt": "2023-02-25T12:00:00Z",
      "updatedAt": "2023-02-25T12:00:00Z"
    }
  ],
  "error": null
}
Get Voice Model Progress
Retrieves the current progress of a voice model, including which steps have recordings.
Endpoint: GET /api/voice-mimic/voice-model/{voiceModelId}/progress
Response:
jsonCopy{
  "data": {
    "voiceModelId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "totalSteps": 5,
    "completedSteps": 3,
    "steps": [
      {
        "stepId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "stepNumber": 1,
        "transcriptText": "The quick brown fox jumps over the lazy dog.",
        "recording": {
          "audioSnippetId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "audioFilePath": "/uploads/audio/recording.wav",
          "recordedAt": "2023-02-25T12:00:00Z"
        }
      }
    ]
  },
  "error": null
}
Initiate Model Training
Starts the training process for a voice model using its associated audio snippets.
Endpoint: POST /api/voice-mimic/voice-model/{voiceModelId}/train
Response:
jsonCopy{
  "data": {
    "message": "Model training initiated successfully."
  },
  "error": null
}
Speech Synthesis
Generate Speech Using Model
Generates speech for a given text using a specific voice model.
Endpoint: POST /api/voice-mimic/synthesize/{voiceModelId}
Request Body:
jsonCopy{
  "textToSynthesize": "This is the text that will be converted to speech using the selected voice model."
}
Response:
jsonCopy{
  "data": {
    "audioUrl": "/audio/synthesized/3fa85f64-5717-4562-b3fc-2c963f66afa6.wav"
  },
  "error": null
}
HuggingFace Model Management
List HuggingFace Models
Retrieves all voice models stored in HuggingFace that match the voice model prefix.
Endpoint: GET /api/voice-mimic/huggingface-models
Response:
jsonCopy{
  "data": [
    {
      "modelId": "username/voice-model-3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Voice Model Name",
      "description": "Description of the HuggingFace model",
      "lastModified": "2023-02-25T12:00:00Z",
      "isLinkedToVoiceModel": true,
      "linkedVoiceModelId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    }
  ],
  "error": null
}
Delete HuggingFace Model
Deletes a model from HuggingFace. Models linked to active voice models cannot be deleted.
Endpoint: DELETE /api/voice-mimic/huggingface-model/{modelName}
Response:
jsonCopy{
  "data": true,
  "error": null
}
Error Handling
All API endpoints return errors in the following format:
jsonCopy{
  "data": null,
  "error": {
    "message": "Error message describing what went wrong",
    "code": "ERROR_CODE",
    "details": "Optional additional details about the error"
  }
}
Common error codes:

VOICE_MODEL_NOT_FOUND: The specified voice model does not exist
AUDIO_SNIPPET_NOT_FOUND: The specified audio snippet does not exist
INVALID_ID_FORMAT: The provided ID is not in a valid format
INVALID_OPERATION: The requested operation cannot be performed
UPLOAD_SNIPPET_ERROR: Error uploading audio snippet
VOICE_TRAIN_ERROR: Error training voice model
SPEECH_SYNTHESIS_ERROR: Error synthesizing speech
MODEL_RETRIEVE_ERROR: Error retrieving models from HuggingFace
MODEL_DELETE_ERROR: Error deleting model from HuggingFace

Integration Example
Here's an example of how to use the API with Angular:
typescriptCopy// Service method to create a voice model
createVoiceModel(request: CreateVoiceModelRequest): Observable<CreateVoiceModelResponse> {
  return this.http.post<ApiResponse<CreateVoiceModelResponse>>(
    `${this.baseUrl}/api/voice-mimic/create-voice-model`, 
    request
  ).pipe(
    map(response => {
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    })
  );
}

// Service method to upload audio
uploadAudioSnippet(voiceModelId: string, audioBlob: Blob, stepId: string): Observable<AudioSnippetUploadResponse> {
  const formData = new FormData();
  formData.append('audioFile', audioBlob, 'recording.wav');
  formData.append('stepId', stepId);
  
  return this.http.post<ApiResponse<AudioSnippetUploadResponse>>(
    `${this.baseUrl}/api/voice-mimic/voice-model/${voiceModelId}/audio-snippet`,
    formData
  ).pipe(
    map(response => {
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    })
  );
}

// Service method to initiate training
initiateModelTraining(voiceModelId: string): Observable<TrainModelResponse> {
  return this.http.post<ApiResponse<TrainModelResponse>>(
    `${this.baseUrl}/api/voice-mimic/voice-model/${voiceModelId}/train`, 
    {}
  ).pipe(
    map(response => {
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    })
  );
}

// Service method to synthesize speech
synthesizeSpeech(voiceModelId: string, text: string): Observable<SynthesizeSpeechResponse> {
  return this.http.post<ApiResponse<SynthesizeSpeechResponse>>(
    `${this.baseUrl}/api/voice-mimic/synthesize/${voiceModelId}`,
    { textToSynthesize: text }
  ).pipe(
    map(response => {
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    })
  );
}
Testing the Integration

Create a Voice Model: Start by creating a voice model
Record Audio Samples: Upload at least 5 audio recordings for different steps
Train the Model: Initiate training once all samples are uploaded
Check Training Status: Monitor the model status until it completes
Generate Speech: Once training is complete, test by generating speech with sample text

This integration guide should help your UI team implement the front-end components that interact with your Voice Mimicking API.
