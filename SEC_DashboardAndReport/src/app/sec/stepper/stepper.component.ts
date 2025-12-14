import { animate, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
    selector: 'app-stepper',
    templateUrl: './stepper.component.html',
    styleUrls: ['./stepper.component.scss'],
    animations: [
        trigger('toggleReplies', [
            transition(':enter', [
                style({ height: '0', opacity: 0 }),
                animate('200ms ease-out', style({ height: '*', opacity: 1 }))
            ]),
        ])
    ],
    standalone: false
})
export class StepperComponent implements OnChanges {
  @Input() stages!: { title: string; completed: boolean }[];
  @Input() currentStageIndex!: number;
  init=true

  // Lifecycle hook to detect changes in currentStageIndex
  ngOnChanges(changes: SimpleChanges): void {
    console.log('init');
    console.log(this.stages, this.currentStageIndex);
    if (
      changes['currentStageIndex'] &&
      !changes['currentStageIndex'].firstChange
    ) {
      this.reinitializeStepper();
    }
  }

  reinitializeStepper(): void {
    this.init=false
    this.stages.forEach((stage, index) => {
      stage.completed = index < this.currentStageIndex;
    });
    setTimeout(()=>{
      this.init=true
    },200)
  }
}
