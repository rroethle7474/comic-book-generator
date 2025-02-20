import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VoiceMimickingService } from '../../../core/services/voice-mimicking.service';
import { VoiceModelListResponse } from '../../../core/models/api.models';

@Component({
  selector: 'app-voice-model-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './voice-model-selector.component.html',
  styleUrls: ['./voice-model-selector.component.css']
})
export class VoiceModelSelectorComponent implements OnInit {
  @Input() selectedModelId: string | null = null;
  @Input() disabled: boolean = false;
  @Output() modelSelected = new EventEmitter<string>();

  incompleteModels: VoiceModelListResponse[] = [];

  constructor(private voiceMimickingService: VoiceMimickingService) {}

  ngOnInit() {
    this.loadIncompleteModels();
  }

  refreshModels() {
    this.loadIncompleteModels();
  }

  loadIncompleteModels() {
    this.voiceMimickingService.getIncompleteVoiceModels()
      .subscribe({
        next: (models) => {
          this.incompleteModels = models;
        },
        error: (error) => {
          console.error('Error loading incomplete voice models:', error);
        }
      });
  }

  onModelSelect(modelId: string) {
    this.modelSelected.emit(modelId);
  }
}
