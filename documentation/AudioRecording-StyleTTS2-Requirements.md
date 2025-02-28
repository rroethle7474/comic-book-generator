# Audio Recording Requirements for StyleTTS2 Voice Training

## Overview

This document outlines the recent changes made to the audio recording functionality in the frontend application and the corresponding requirements for the backend implementation to ensure compatibility with StyleTTS2 voice training.

## StyleTTS2 Requirements

StyleTTS2 requires audio files that meet the following specifications:
- **File Format**: WAV
- **Sample Rate**: 24kHz (24,000 Hz)
- **Channels**: Mono (single channel)
- **Bit Depth**: 16-bit PCM

## Frontend Implementation Changes

We have updated the frontend code to improve audio recording quality and to better support the StyleTTS2 requirements:

### 1. Audio Capture with Specific Constraints

```typescript
// Specify audio constraints with 24kHz sample rate for StyleTTS2 compatibility
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    sampleRate: 24000,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true
  }
});
```

### 2. MediaRecorder Configuration

```typescript
// Create MediaRecorder with options to ensure proper encoding
const options = { mimeType: 'audio/webm' };
this.mediaRecorder = new MediaRecorder(stream, options);
```

### 3. Audio Format for Upload

```typescript
// Create blob with audio/webm type
const blob = new Blob(chunks, { type: 'audio/webm' });
```

### 4. Additional Metadata for Backend Processing

```typescript
// In voice-mimicking.service.ts
const formData = new FormData();
formData.append('audioFile', audioBlob, 'recording.webm');
formData.append('stepId', stepId);
formData.append('targetSampleRate', '24000');
```

## Backend Requirements

The frontend now sends audio recordings in WebM format with additional metadata. The backend needs to:

1. **Accept WebM Audio Files**: The frontend now sends audio as WebM instead of WAV for better browser compatibility.

2. **Process the `targetSampleRate` Parameter**: The frontend includes a `targetSampleRate` parameter (set to 24000) that the backend should use for conversion.

3. **Convert Audio to StyleTTS2 Format**: Convert the received WebM audio to WAV format with the following specifications:
   - 24kHz sample rate
   - Mono channel
   - 16-bit PCM encoding

4. **Return Consistent File Paths**: The frontend expects the backend to return file paths with `.wav` extension:
   ```
   /uploads/audio/{audioSnippetId}_recording.wav
   ```

## Implementation Recommendations

### Audio Conversion with FFmpeg

FFmpeg is recommended for audio conversion. Here's an example command that would achieve the required conversion:

```bash
ffmpeg -i input.webm -ar 24000 -ac 1 -c:a pcm_s16le output.wav
```

### Pseudocode for Backend Implementation

```
function handleAudioUpload(request):
    // Extract files and parameters
    webmFile = request.files['audioFile']
    stepId = request.form['stepId']
    targetSampleRate = request.form['targetSampleRate'] // Should be "24000"
    
    // Generate a unique ID for the audio snippet
    audioSnippetId = generateUniqueId()
    
    // Save the uploaded webm file temporarily
    tempWebmPath = saveTempFile(webmFile)
    
    // Define the output path for the converted WAV file
    outputWavPath = "/uploads/audio/" + audioSnippetId + "_recording.wav"
    
    // Convert to WAV with the specified sample rate
    // Example using FFmpeg:
    executeCommand("ffmpeg -i " + tempWebmPath + " -ar " + targetSampleRate + " -ac 1 -c:a pcm_s16le " + outputWavPath)
    
    // Clean up the temporary file
    deleteTempFile(tempWebmPath)
    
    // Return the response
    return {
        "audioSnippetId": audioSnippetId,
        "message": "Audio uploaded and converted successfully"
    }
```

## Browser Compatibility Note

While we've specified a 24kHz sample rate in the frontend, browsers may not always honor this exact value. The actual implementation depends on the browser and hardware capabilities. The backend conversion step is crucial to ensure the final WAV files meet the exact 24kHz requirement for StyleTTS2.

## Testing

After implementing these changes, please test the full recording flow to ensure:

1. Audio can be recorded in the browser
2. Files are successfully uploaded to the backend
3. Conversion to 24kHz WAV is successful
4. The converted files are compatible with StyleTTS2 training

## References

- [StyleTTS2 GitHub Repository](https://github.com/yl4579/StyleTTS2)
- [Web Audio API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html) 
