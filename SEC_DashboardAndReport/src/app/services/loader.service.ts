import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LoaderService {
    private _loading = new BehaviorSubject<boolean>(false);
    public loading$ = this._loading.asObservable();
    private requestCount = 0;

    show(): void {
        this.requestCount++;
        if (this.requestCount === 1) {
            this._loading.next(true);
        }
    }

    hide(): void {
        if (this.requestCount > 0) {
            this.requestCount--;
        }
        if (this.requestCount === 0) {
            this._loading.next(false);
        }
    }
}