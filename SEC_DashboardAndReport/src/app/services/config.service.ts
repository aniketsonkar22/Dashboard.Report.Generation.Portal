import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  get apiUrl(): string {
    const win = window as any;
    return (win.__env && typeof win.__env.apiUrl === 'string') ? win.__env.apiUrl : '';
  }
}


