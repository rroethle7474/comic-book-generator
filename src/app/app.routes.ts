// app.routes.ts
import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/landing-page/landing-page.component';
import { ComicBookCreateComponent } from './features/comic-book-create/comic-book-create.component';
import { CreateVoiceModelComponent } from './features/create-voice-model/create-voice-model.component';
import { AudioRecordingStepComponent } from './features/audio-recording-step/audio-recording-step.component';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },  // Default route
  { path: 'create', component: ComicBookCreateComponent },
  { path: 'create-voice-model', component: CreateVoiceModelComponent },
  { path: 'audio-recording-step', component: AudioRecordingStepComponent },
  { path: '**', redirectTo: '' }  // Fallback route
];
