import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommentItem } from '../../interfaces';
import { Router } from '@angular/router';

@Component({
    selector: 'app-comments-group',
    templateUrl: './comments-group.component.html',
    styleUrls: ['./comments-group.component.scss'],
    standalone: false
})
export class CommentsGroupComponent implements OnInit {
  @Input() comments!: CommentItem[];
  @Input() type: string = '';
  @Input() status: string = '';
  @Input() statuses: string[] = [];
  @Input() commentId!: number;
  @Output() statusChanged = new EventEmitter<void>();

  constructor(private router: Router) {}

  ngOnInit(): void {}
  goToReport() {
    this.router.navigate(['/reports', this.type]);
  }
  onStatusChanged(): void {
    this.statusChanged.emit(); // Refresh the comments list
  }

  loadComments() {
    this.statusChanged.emit(); // Refresh the comments list
  }
}
