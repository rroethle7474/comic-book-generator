# ComicBookGenerator


## Project Description
A user should be able to create their very own comic book with handdrawn images (or any image), and a story to create scenes. Then a full pdf comic book is created generating new images and a story based on user inputs.

A voice model trainer is also available for the user to submit audio snippets of their voice, however, the training of this model on Replicate is not fully completed at this time (3/13/25)

A to-do will be for the fine tuned audio model to read the story back to you while you view the finished comic.


## Additional Dependencies
This project is designed to only be run locally with the other StoryTimeComicBookAPI (https://github.com/rroethle7474/StoryTimeComicBookApi). Please review the README associated with that API before running.

Both a Replicate and LLM API key (OpenAI, Anthropic, Gemini) in order to properly generate the images, train the voice model, and create the story.

All files are saved on the user's local machine.

A postgreSQL database is also required for local development.

## Development server
Navigate to comic-book-generator folder ('cd comic-book-generator')

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.1.3.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Project Structure

The application follows a modular architecture with clear separation of concerns:

### Core Structure

```
src/app/
├── core/                  # Core functionality used throughout the app
│   ├── guards/            # Route guards for authentication/authorization
│   ├── interceptors/      # HTTP interceptors
│   ├── models/            # Data models and interfaces
│   └── services/          # Application-wide services
├── features/              # Feature modules (main pages)
├── layout/                # Layout components (header, footer)
├── shared/                # Shared components, directives, and pipes
└── app.routes.ts          # Application routing configuration
```

### Key Features/Pages

- **Landing Page** (`/`): Entry point to the application
- **Comic Book Creation** (`/create`): Interface for creating new comic books
- **Voice Model Creation** (`/create-voice-model`): Tools for creating voice models
- **Audio Recording** (`/audio-recording-step`): Recording interface for voice models
- **Comic Book Status** (`/create-comic-book-status`): Status tracking for comic creation
- **View Comics** (`/view-comics`): Gallery of created comics
- **View Comic** (`/view-comic/:assetId`): Detailed view of a specific comic
- **Voice Models** (`/view-voice-models`): Management of voice models

### Services and Models

The application uses several key services to manage data flow:

- **ComicBookService**: Handles comic book creation, updating, and generation
  - Manages scenes, assets, and generation status
  - Provides observables for tracking generation progress
  - Handles API communication for comic-related operations

- **VoiceMimickingService**: Manages voice model creation and usage
  - Handles audio recording and processing
  - Integrates with voice synthesis APIs

- **ApiBaseService**: Base service for API communication
  - Provides common HTTP methods and error handling
  - Manages authentication headers and request formatting

### Data Models

The application uses several key data models:

- **Comic Book Models**: Structures for comic creation, scenes, and assets
- **Scene Management Models**: Models for managing comic book scenes
- **API Models**: Interfaces for API requests and responses

### Component Interaction

- **State Management**: Services use BehaviorSubject observables to maintain application state
- **Data Flow**: Components subscribe to services to receive updates
- **API Communication**: Services handle all API calls, with components consuming the results

### UI Framework

The application uses Angular with Tailwind CSS for styling, providing:
- Responsive design across devices
- Modern, clean UI components
- Consistent styling throughout the application

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
