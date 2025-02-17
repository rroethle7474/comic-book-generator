import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { trigger, transition, style, animate, state } from '@angular/animations';

@Component({
  selector: 'app-comic-book-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './comic-book-create.component.html',
  styleUrls: ['./comic-book-create.component.css'],
  animations: [
    trigger('slideInOut', [
      state('void', style({
        transform: 'translateX(100%)',
        opacity: 0
      })),
      state('*', style({
        transform: 'translateX(0)',
        opacity: 1
      })),
      transition(':enter', [
        animate('300ms ease-in')
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ transform: 'translateX(-100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class ComicBookCreateComponent implements OnInit {
  comicForm!: FormGroup;
  currentStep = 0;
  totalSteps = 4;

  constructor(private fb: FormBuilder) {
    this.initForm();
  }

  ngOnInit() {
    // Make sure form is initialized
    if (!this.comicForm) {
      this.initForm();
    }
  }

  private initForm() {
    this.comicForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      scenes: this.fb.array([]),
    });
    // Initialize with first scene
    this.addScene();
  }

  get scenes(): FormArray {
    return this.comicForm.get('scenes') as FormArray;
  }

  getSceneFormGroup(index: number): FormGroup {
    return this.scenes.at(index) as FormGroup;
  }

  addScene() {
    if (this.scenes.length < 6) {
      this.scenes.push(this.fb.group({
        image: [null, Validators.required],
        description: ['', Validators.required]
      }));
    }
  }

  removeScene(index: number) {
    if (this.scenes.length > 1) {
      this.scenes.removeAt(index);
    }
  }

  nextStep() {
    if (this.currentStep < this.totalSteps - 1) {
      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  submit() {
    if (this.comicForm.valid) {
      console.log('Form Submitted:', this.comicForm.value);
      // Stub: Integrate with a service to send data to the backend.
    } else {
      console.log('Form is invalid.');
    }
  }
}
