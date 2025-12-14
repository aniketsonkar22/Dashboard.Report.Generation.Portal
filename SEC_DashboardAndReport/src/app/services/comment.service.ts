import { Injectable } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { CommentItem } from '../sec/interfaces';
import { environment } from '../../environments/environment'
import { ConfigService } from './config.service'


@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private get baseUrl(): string { return (this.config.apiUrl || environment.apiUrl || ''); }
  private get apiUrl(): string { return this.baseUrl + '/api/common/comments'; }

  constructor(private http: HttpClient, private config: ConfigService) {}

  // Retrieve all comments with optional filters for status, reportType, and departmentId
  getComments(status?: string, reportType?: string, departmentId?: string): Observable<{ comments: CommentItem[]; statusOptions: string[] }> {
    let params = new HttpParams()
    if (status) {
      params = params.set('status', status)
    }
    if (reportType) {
      params = params.set('reportType', reportType)
    }
    if (departmentId) {
      params = params.set('departmentId', departmentId)
    }

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      catchError(error => {
        console.error('CommentService: Error fetching comments:', error);
        throw error;
      })
    )
  }

  // Add a new comment
  addComment(comment: CommentItem, roleId:string=''): Observable<CommentItem> {
    return this.http.post<any>(this.apiUrl, comment ,{withCredentials:true}).pipe(
      catchError(error => {
        console.error('CommentService: Error adding comment:', error);
        throw error;
      })
    )
  }

  // Add a reply to an existing comment
  addReply(commentId: any, replyData: Partial<CommentItem>, roleId:string=''): Observable<CommentItem> {
    return this.http.post<any>(`${this.apiUrl}/${commentId}/reply`, replyData,{withCredentials:true}).pipe(
      catchError(error => {
        console.error('CommentService: Error adding reply:', error);
        throw error;
      })
    )
  }

  // Update the status of a comment by ID
  updateCommentStatus(id: any, status: string, userName:string, roleId:string =''): Observable<CommentItem> {
    return this.http.put<any>(`${this.apiUrl}/${id}/status`, { status, userName},{withCredentials:true}).pipe(
      catchError(error => {
        console.error('CommentService: Error updating comment status:', error);
        throw error;
      })
    )
  }
}



