// app.routes.ts
import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/landing-page/landing-page.component';
import { ComicBookCreateComponent } from './features/comic-book-create/comic-book-create.component';
import { CreateVoiceModelComponent } from './features/create-voice-model/create-voice-model.component';
import { AudioRecordingStepComponent } from './features/audio-recording-step/audio-recording-step.component';
import { CreateComicBookStatusComponent } from './features/create-comic-book-status/create-comic-book-status.component';
import { ViewComicComponent } from './features/view-comic/view-comic.component';
import { ViewComicsComponent } from './features/view-comics/view-comics.component';
import { ViewVoiceModelsComponent } from './features/view-voice-models/view-voice-models.component';
export const routes: Routes = [
  { path: '', component: LandingPageComponent },  // Default route
  { path: 'create', component: ComicBookCreateComponent },
  { path: 'create-voice-model', component: CreateVoiceModelComponent },
  { path: 'audio-recording-step', component: AudioRecordingStepComponent },
  { path: 'create-comic-book-status', component: CreateComicBookStatusComponent },
  { path: 'view-comic/:assetId', component: ViewComicComponent },
  { path: 'view-comics', component: ViewComicsComponent },
  { path: 'view-voice-models', component: ViewVoiceModelsComponent },
  { path: '**', redirectTo: '' }  // Fallback route
];
