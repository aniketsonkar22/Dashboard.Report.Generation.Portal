import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AuditLog } from '../../interfaces';
import { LogService } from 'src/app/services/log.service';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ViewportScroller } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, Observable } from 'rxjs';

@Component({
    selector: 'app-logs-page',
    templateUrl: './logs-page.component.html',
    styleUrls: ['./logs-page.component.scss'],
    standalone: false
})
export class LogsPageComponent implements OnInit, AfterViewInit, OnDestroy {
  constructor(
    private logService: LogService,
    private scroller: ViewportScroller,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.route.queryParams.subscribe((params) => {
      this.logId = params['id'];
    });
    this.url$ = router.events.pipe(
      filter((event: any) => event instanceof NavigationEnd),
      map((event: NavigationEnd) => JSON.stringify(event.url))
    );
    this.url$.subscribe((data) => {
      this.currentRoute = this.convertUrlString(data).replaceAll('"', '');
      console.log(this.convertUrlString(data).replaceAll('"', ''));
      this.selectedTabIndex = this.currentRoute;
      this.getTabIndex();
    });
  }
  currentRoute = '';
  url$: Observable<string> = new Observable<string>();
  ngOnInit(): void {
    this.selectedTabIndex = this.tabLabels[0];
    this.loadFirstPage();
  }
  // ngAfterViewInit(): void {
  //   if (this.logId) {
  //     setTimeout(() => {
  //       this.scroller.setOffset([200, 200]);
  //       this.scroller.scrollToAnchor(this.logId);
  //     }, 500);
  //   }
  // }
  tabLabels: string[] = [
    'Distribution',
    'Retail',
    'Transmission',
    'System operator',
  ];
  logId!: string;

  selectedTabIndex: string = this.tabLabels[0]; // Initialize with the first tab
  selectedIndex!: number;

  onTabChange(event: MatTabChangeEvent): void {
    this.selectedTabIndex = this.tabLabels[event.index];
    console.log('Selected tab index:', this.selectedTabIndex);
    // reset and load from page 1
    this.pageNumber = 1;
    this.hasMore = true;
    this.REPORT_LOG_DATA = [];
    this.loadFirstPage();
    this.selectedIndex = this.getTabIndex();
  }

  // Infinite scroll state
  pageNumber: number = 1;
  pageSize: number = 10;
  loadingMore: boolean = false;
  hasMore: boolean = true;

  private loadFirstPage(): void {
    this.loadingMore = true;
    this.logService.getLogs(this.pageNumber, this.pageSize).subscribe({
      next: (response) => {
        this.REPORT_LOG_DATA = response.logs;
        this.hasMore = (response.logs?.length ?? 0) === this.pageSize;
        this.loadingMore = false;
      },
      error: (err) => {
        console.error('Failed to fetch logs:', err);
        this.REPORT_LOG_DATA = [];
        this.loadingMore = false;
        this.hasMore = false;
      }
    });
  }

  private loadNextPage(): void {
    if (!this.hasMore || this.loadingMore) return;
    this.loadingMore = true;
    this.pageNumber += 1;
    this.logService.getLogs(this.pageNumber, this.pageSize).subscribe({
      next: (response) => {
        this.REPORT_LOG_DATA = [...this.REPORT_LOG_DATA, ...response.logs];
        this.hasMore = (response.logs?.length ?? 0) === this.pageSize;
        this.loadingMore = false;
      },
      error: (err) => {
        console.error('Failed to fetch more logs:', err);
        this.loadingMore = false;
        this.hasMore = false;
      }
    });
  }

  // IntersectionObserver to detect when footer enters viewport
  @ViewChild('sentinel', { static: false }) sentinelRef?: ElementRef<HTMLDivElement>;
  private io?: IntersectionObserver;

  ngAfterViewInit(): void {
    if (this.logId) {
      setTimeout(() => {
        this.scroller.setOffset([200, 200]);
        this.scroller.scrollToAnchor(this.logId);
      }, 500);
    }

    // Setup intersection observer
    setTimeout(() => {
      if (this.sentinelRef) {
        this.io = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.loadNextPage();
            }
          });
        }, { root: null, rootMargin: '0px', threshold: 1.0 });
        this.io.observe(this.sentinelRef.nativeElement);
      }
    });
  }

  ngOnDestroy(): void {
    this.io?.disconnect();
  }

  REPORT_LOG_DATA: AuditLog[] = [];

  getTabIndex(): number {
    const index = this.tabLabels.findIndex(
      (item: any) => item.toLowerCase() === this.selectedTabIndex.toLowerCase()
    );
    return index !== -1 ? index : 0;
  }
  convertUrlString(url: string): string {
    // Remove any query parameters by splitting at "?"
    const baseUrl = url.split('?')[0];

    // Remove the "/reports/" prefix
    const withoutPrefix = baseUrl.replace('/logs/', '');

    // Decode any URL-encoded characters (e.g., '%20' to ' ')
    const decodedString = decodeURIComponent(withoutPrefix);

    // Capitalize each word
    const capitalized = decodedString
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return capitalized;
  }
}
