// app.routes.ts
import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/landing-page/landing-page.component';
import { ComicBookCreateComponent } from './features/comic-book-create/comic-book-create.component';


export const routes: Routes = [
  { path: '', component: LandingPageComponent },  // Default route
  { path: 'create', component: ComicBookCreateComponent },
  { path: '**', redirectTo: '' }  // Fallback route
];
