// scroll-end.directive.ts
import {  EventEmitter, Input, OnDestroy, OnInit, Optional, Output } from '@angular/core';
export enum SCROLLEND_DIRECTION {
  DOWN = 'down',
  UP = 'UP',
}

@Directive({
    selector: '[scrollEnd]',
    standalone: false
})
export class ScrollEndDirective implements OnInit, OnDestroy {
  @Output() scrollEnd: EventEmitter<any> = new EventEmitter();

  @Input() rootMargin = '0px 0px 0px 0px';
  @Input('direction') desiredDirection: SCROLLEND_DIRECTION = SCROLLEND_DIRECTION.DOWN;

  observer!: IntersectionObserver;
  previousEntry!: IntersectionObserverEntry;
  scrollDirection!: SCROLLEND_DIRECTION;

  constructor(
    private el: ElementRef,
    @Optional() private scrollEndRoot: ScrollEndRootDirective,
  ) { }

  ngOnInit(): void {
    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        this.scrollDirection = this.previousEntry?.boundingClientRect.bottom > entry.boundingClientRect.bottom ? SCROLLEND_DIRECTION.DOWN : SCROLLEND_DIRECTION.UP;

        if (!this.previousEntry?.isIntersecting && entry.isIntersecting && this.scrollDirection === this.desiredDirection) {
          this.scrollEnd.emit();
        }

        this.previousEntry = entry;
      });
    }, {
      root: this.scrollEndRoot?.el.nativeElement,
      rootMargin: this.rootMargin,
    });

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// scroll-end-root.directive.ts
import { Directive, ElementRef } from '@angular/core';

@Directive({
    selector: '[scrollEndRoot]',
    standalone: false
})
export class ScrollEndRootDirective {
  constructor(
    public el: ElementRef,
  ) {
  }
}