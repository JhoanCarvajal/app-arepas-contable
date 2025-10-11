import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular/standalone';
import { IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonContent, IonList, IonItem, IonLabel, IonCheckbox } from '@ionic/angular/standalone';
import { Box } from '../../services/boxes.service';

@Component({
  standalone: true,
  selector: 'app-box-selection-modal',
  templateUrl: 'box-selection-modal.component.html',
  imports: [CommonModule, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonContent, IonList, IonItem, IonLabel, IonCheckbox]
})
export class BoxSelectionModalComponent {
  @Input() allBoxes: Box[] = [];
  @Input() initialSelectedIds: number[] = [];

  private modalCtrl = inject(ModalController);

  // internal set for fast lookup/modification
  selectedIds = new Set<number>(this.initialSelectedIds ?? []);

  ngOnInit() {
    // ensure set initialized with any inputs
    if (this.initialSelectedIds && this.initialSelectedIds.length) {
      this.selectedIds = new Set<number>(this.initialSelectedIds);
    }
  }

  isSelected(boxId: number) {
    return this.selectedIds.has(boxId);
  }

  toggle(boxId: number) {
    if (this.selectedIds.has(boxId)) this.selectedIds.delete(boxId);
    else this.selectedIds.add(boxId);
  }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    // return array of selected ids
    return this.modalCtrl.dismiss(Array.from(this.selectedIds), 'confirm');
  }
}
