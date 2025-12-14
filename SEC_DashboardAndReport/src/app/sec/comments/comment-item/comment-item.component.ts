import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommentItem } from '../../interfaces';
import { CommentService } from 'src/app/services/comment.service';
import { ReplyDialogComponent } from '../../reply-dialog/reply-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { animate, style, transition, trigger } from '@angular/animations';
import { userInfo } from 'os';
import { AuthServiceAD } from 'src/app/services/auth-ad.service';

@Component({
    selector: 'app-comment-item',
    templateUrl: './comment-item.component.html',
    styleUrls: ['./comment-item.component.scss'],
    animations: [
        trigger('toggleReplies', [
            transition(':enter', [
                style({ height: '0', opacity: 0 }),
                animate('200ms ease-out', style({ height: '*', opacity: 1 })),
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ height: '0', opacity: 0 })),
            ]),
        ]),
    ],
    standalone: false
})
export class CommentItemComponent implements OnInit {
  @Input() commentItem!: CommentItem;
  @Input() commentId!: number;

  @Output() statusChanged = new EventEmitter<void>();

  showReplies = false; // Toggle replies visibility

  constructor(
    private commentService: CommentService,
    private dialog: MatDialog,
    private authService: AuthServiceAD
  ) {}

  ngOnInit(): void {
    // console.log(this.commentId, this.commentItem.id)
    let temp = this.commentId;
    this.commentId = 0;

    setTimeout(() => {
      this.commentId = temp;
    }, 1000);
  }

  changeStatus(status: string) {
    let userInfo: any = this.authService.userInfo?.valueOf();
    this.commentService
      .updateCommentStatus(this.commentItem.id, status, userInfo.data.name)
	  // .updateCommentStatus(this.commentItem.id, status, 'test')

      .subscribe(() => {
        this.statusChanged.emit();
      });
  }

  openReplyDialog(comment: CommentItem): void {
   let userInfo: any = this.authService.userInfo?.valueOf();
    const dialogRef = this.dialog.open(ReplyDialogComponent, {
      width: '400px',
      data: {
        commentId: comment.id,
        parentComment: comment,
		    userName: userInfo.data.name,
        // userName: 'test',
        department: comment.department,
        reportType: comment.reportType,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.commentService.addReply(comment.id, result).subscribe(
          (reply) => {
            comment.replies = comment.replies
              ? [...comment.replies, reply]
              : [reply];
          },
          (error) => {
            console.error('Failed to add reply', error);
          }
        );
      }
    });
  }

  // Toggle visibility of replies
  toggleReplies() {
    this.showReplies = !this.showReplies;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Pending':
        return 'status-pending';
      case 'Actioned':
        return 'status-review';
      case 'Declined':
        return 'status-error';
      default:
        return '';
    }
  }
}
