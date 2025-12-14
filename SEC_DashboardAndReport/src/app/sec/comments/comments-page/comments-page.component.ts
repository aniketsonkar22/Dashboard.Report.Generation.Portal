import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { CommentItem, Department, KPI } from "../../interfaces";
import { DepartmentApiService } from "src/app/services/department-api.service";
import { DepartmentKpiApiService } from "src/app/services/department-kpi-api.service";
import { KpiApiService } from "src/app/services/kpi-api.service";
import { MatTabChangeEvent } from "@angular/material/tabs";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { filter, map, Observable } from "rxjs";

@Component({
  selector: "app-comments-page",
  templateUrl: "./comments-page.component.html",
  styleUrls: ["./comments-page.component.scss"],
  standalone: false,
})
export class CommentsPageComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private departmentApi: DepartmentApiService,
    private departmentKpiApi: DepartmentKpiApiService,
    private kpiApi: KpiApiService
  ) {
    this.route.queryParams.subscribe((params) => {
      // Support deep linking with filters
      const depId = params["departmentId"] as string | undefined;
      const kpiId = params["kpiId"] as string | undefined;
      const commentId = params["commentId"] as string | undefined;
      if (depId) {
        this.initialDepartmentIdFromQuery = depId;
      }
      if (kpiId) {
        this.initialKpiIdFromQuery = kpiId;
      }
      if (commentId) {
        this.initialCommentIdFromQuery = parseInt(commentId);
        this.commentId = this.initialCommentIdFromQuery;
      }
      console.log('Initial comment ID:', this.initialCommentIdFromQuery);
    });
    this.url$ = router.events.pipe(
      filter((event: any) => event instanceof NavigationEnd),
      map((event: NavigationEnd) => JSON.stringify(event.url))
    );
    this.url$.subscribe((data) => {
      this.currentRoute = this.convertUrlString(data).replaceAll('"', "");
      console.log(this.convertUrlString(data).replaceAll('"', ""));
      this.selectedTabIndex = this.currentRoute;
      this.getTabIndex();
    });
  }
  getTabIndex(): number {
    const index = this.tabLabels.findIndex(
      (item: any) => item.toLowerCase() === this.selectedTabIndex.toLowerCase()
    );
    return index !== -1 ? index : 0;
  }
  currentRoute = "";
  url$: Observable<string> = new Observable<string>();
  selectedIndex!: number;

  commentId!: number;
  // Initial filters from query params
  private initialDepartmentIdFromQuery?: string;
  private initialKpiIdFromQuery?: string;
  private initialCommentIdFromQuery?: number;
  ngOnInit(): void {
    this.loadComments();
    this.selectedTabIndex = "All";
    this.selectedIndex = 0;
    this.loadDepartments();
  }

  tabLabels: string[] = [];

  selectedTabIndex: string = this.tabLabels[0]; // Initialize with the first tab

  onTabChange(event: MatTabChangeEvent): void {
    // Index 0 is "All"; other indices map to departments with offset -1
    if (event.index === 0) {
      this.selectedDepartmentId = this.EMPTY_GUID;
    } else {
      const dep = this.departments[event.index - 1];
      if (dep) {
        this.selectedDepartmentId = dep.id;
      }
    }
    this.selectedIndex = event.index;
    this.selectedKpiId = "";
    this.kpis = [];
    this.loadKpisForDepartment();
  }
  departments: Department[] = [];
  selectedDepartmentId: string = "";
  departmentsTotalCount = 0;
  private departmentIdToName = new Map<string, string>();
  kpis: KPI[] = [];
  selectedKpiId: string = "";

  private loadDepartments(): void {
    this.departmentApi
      .getDepartments({ pageNumber: 1, pageSize: 1000 })
      .subscribe({
        next: (resp: any) => {
          if (resp && resp.success && resp.data) {
            // New API response format
            this.departments = resp.data.items as Department[];
            this.departmentsTotalCount =
              resp.data.totalCount || resp.data.items.length;
          } else if (resp?.data) {
            this.departments = resp.data as Department[];
            this.departmentsTotalCount =
              resp.totalCount ?? resp.resultCount ?? this.departments.length;
          } else if (Array.isArray(resp?.items)) {
            this.departments = resp.items as Department[];
            this.departmentsTotalCount =
              resp.totalCount ?? this.departments.length;
          } else {
            this.departments = Array.isArray(resp) ? resp : [];
            this.departmentsTotalCount = this.departments.length;
          }
          // Use departments as tabs
          if (this.departments.length) {
            this.tabLabels = ['All', ...this.departments.map((d) => d.name)];
            // Build department id -> name map for quick lookups
            this.departmentIdToName = new Map<string, string>(
              this.departments.map(d => [d.id, d.name])
            );
            console.log("Selected Department ID:", this.selectedDepartmentId);
            // Apply department selection precedence: query param > existing > default
            const targetDepartmentId = this.initialDepartmentIdFromQuery || this.selectedDepartmentId;
            if (!targetDepartmentId) {
              this.selectedDepartmentId = this.EMPTY_GUID;
              this.selectedIndex = 0;
            } else if (targetDepartmentId === this.EMPTY_GUID) {
              this.selectedDepartmentId = this.EMPTY_GUID;
              this.selectedIndex = 0;
            } else {
              const idx = this.departments.findIndex((d) => d.id === targetDepartmentId);
              if (idx >= 0) {
                this.selectedDepartmentId = targetDepartmentId;
                this.selectedIndex = idx + 1; // offset for 'All'
              } else {
                // Fallback to All if not found
                this.selectedDepartmentId = this.EMPTY_GUID;
                this.selectedIndex = 0;
              }
            }
            // Clear initial depId after applying once
            this.initialDepartmentIdFromQuery = undefined;
            this.loadKpisForDepartment();
          } else {
            this.tabLabels = [];
            this.selectedDepartmentId = "";
            this.selectedIndex = 0;
            this.departmentIdToName.clear();
          }
        },
        error: () => {
          this.departments = [];
        },
      });
  }

  private loadKpisForDepartment(): void {
    if (!this.selectedDepartmentId) {
      this.kpis = [];
      this.selectedKpiId = "";
      return;
    }

    // If "All" is selected, load all KPIs
    if (this.selectedDepartmentId === this.EMPTY_GUID) {
      this.kpiApi.getKpis({ pageNumber: 1, pageSize: 1000 }).subscribe({
        next: (respAny: any) => {
          let all: KPI[] = [];
          if (respAny?.success && respAny?.data?.items) {
            all = respAny.data.items;
          } else if (respAny?.data && Array.isArray(respAny.data)) {
            all = respAny.data;
          } else if (respAny?.items) {
            all = respAny.items;
          } else if (Array.isArray(respAny)) {
            all = respAny;
          }
          this.kpis = all;
          // Apply KPI selection precedence: query param > existing > first
          const targetKpiId = this.initialKpiIdFromQuery || this.selectedKpiId;
          if (targetKpiId) {
            const exists = this.kpis.some(k => k.id === targetKpiId);
            this.selectedKpiId = exists ? targetKpiId : (this.kpis[0]?.id || "");
          } else if (this.kpis.length) {
            this.selectedKpiId = this.kpis[0].id;
          }
          // Clear initial kpiId after applying once
          this.initialKpiIdFromQuery = undefined;
          this.loadComments();
        },
        error: () => {
          this.kpis = [];
          this.selectedKpiId = "";
        },
      });
      return;
    }

    // Otherwise, load KPIs for the selected department
    this.departmentKpiApi
      .getDepartmentKpis(
        this.selectedDepartmentId,
        undefined, // status
        1, // pageNumber
        1000 // pageSize - using large number for comments page
      )
      .subscribe({
        next: (deptKpisResponse: any) => {
          console.log("Department KPIs response:", deptKpisResponse);
          let deptKpis: any[] = [];
          if (deptKpisResponse?.success && deptKpisResponse?.data) {
            deptKpis = Array.isArray(deptKpisResponse.data)
              ? deptKpisResponse.data
              : deptKpisResponse.data.items || [];
          } else if (deptKpisResponse?.data) {
            deptKpis = Array.isArray(deptKpisResponse.data)
              ? deptKpisResponse.data
              : deptKpisResponse.data.items || [];
          } else if (Array.isArray(deptKpisResponse)) {
            deptKpis = deptKpisResponse;
          }

          const kpiIds = deptKpis.map((dk: any) => dk.kpiId);
          this.kpiApi.getKpis({ pageNumber: 1, pageSize: 1000 }).subscribe({
            next: (respAny: any) => {
              let all: KPI[] = [];
              console.log("KPI API response:", respAny);
              if (respAny?.success && respAny?.data?.items) {
                all = respAny.data.items;
              } else if (respAny?.data && Array.isArray(respAny.data)) {
                all = respAny.data;
              } else if (respAny?.items) {
                all = respAny.items;
              } else if (Array.isArray(respAny)) {
                all = respAny;
              }
              const mapById = new Map<string, KPI>(all.map((k) => [k.id, k]));
              this.kpis = kpiIds
                .map((id: any) => mapById.get(id))
                .filter(Boolean) as KPI[];
          // Apply KPI selection precedence: query param > existing > first
          const targetKpiId = this.initialKpiIdFromQuery || this.selectedKpiId;
          if (targetKpiId) {
            const exists = this.kpis.some(k => k.id === targetKpiId);
            this.selectedKpiId = exists ? targetKpiId : (this.kpis[0]?.id || "");
          } else if (this.kpis.length) {
            this.selectedKpiId = this.kpis[0].id;
          }
          // Clear initial kpiId after applying once
          this.initialKpiIdFromQuery = undefined;
              this.loadComments();
            },
            error: () => {
              this.kpis = [];
              this.selectedKpiId = "";
            },
          });
        },
        error: () => {
          this.kpis = [];
          this.selectedKpiId = "";
        },
      });
  }

  // Load first page of comments
  loadComments(): void {
    if (!this.selectedDepartmentId || !this.selectedKpiId) {
      this.comments = [];
      this.allComments = [];
      this.visibleComments = [];
      this.hasMore = false;
      return;
    }
    this.loadFirstPage();
  }

  private loadFirstPage(): void {
    this.pageNumber = 1;
    this.loadingMore = true;
    this.departmentKpiApi
      .getDepartmentKpiComments(
        this.selectedDepartmentId,
        this.selectedKpiId,
        this.pageNumber,
        this.pageSize
      )
      .subscribe({
        next: (data: any) => {
          console.log("Comments API response:", data);
          let arr: any[] = [];
          let totalCount = 0;

          if (data && data.success && data.data) {
            arr = Array.isArray(data.data) ? data.data : data.data.items || [];
            totalCount = data.data.totalCount || 0;
          } else if (data && data.data) {
            arr = Array.isArray(data.data) ? data.data : data.data.items || [];
            totalCount = data.data.totalCount || 0;
          } else if (Array.isArray(data)) {
            arr = data;
            totalCount = data.length;
          } else if (data?.comments) {
            arr = data.comments;
            totalCount = data.comments.length;
          }

          const newComments = (arr as any[]).map((c: any) => {
            const deptId: string | undefined = c.departmentId || c.department?.id;
            const deptNameFromMap = deptId ? this.departmentIdToName.get(deptId) : undefined;
            const department = deptNameFromMap || c.departmentName || '';
            return {
              id: c.id,
              commentText: c.text,
              userName: c.addedBy,
              timestamp: c.addedAt,
              status: "Open",
              department
            } as CommentItem;
          });

          this.allComments = newComments;
          this.visibleComments = newComments;
          // Check if there are more pages available
          const currentPage = this.pageNumber;
          const totalPages = Math.ceil(totalCount / this.pageSize);
          this.hasMore = currentPage < totalPages;
          this.loadingMore = false;
          this.comments = this.visibleComments;

          console.log("Comments loaded:", {
            loaded: this.allComments.length,
            total: totalCount,
            currentPage: currentPage,
            totalPages: totalPages,
            hasMore: this.hasMore,
            pageSize: this.pageSize,
          });

          // Re-setup IntersectionObserver and scroll listener after comments are loaded
          setTimeout(() => {
            this.setupIntersectionObserver();
            this.setupScrollListener();
          }, 100);

          // Debug: Check if sentinel element is visible
          setTimeout(() => {
            if (this.sentinelRef) {
              const rect =
                this.sentinelRef.nativeElement.getBoundingClientRect();
              console.log("Sentinel element position:", {
                top: rect.top,
                bottom: rect.bottom,
                height: rect.height,
                isVisible: rect.top < window.innerHeight && rect.bottom > 0,
              });
            }
          }, 200);
        },
        error: (error) => {
          console.error("Failed to fetch comments:", error);
          this.comments = [];
          this.allComments = [];
          this.visibleComments = [];
          this.hasMore = false;
          this.loadingMore = false;
        },
      });
  }

  onDepartmentRowClick(dep: Department): void {
    if (this.selectedDepartmentId === dep.id) return;
    this.selectedDepartmentId = dep.id;
    this.selectedKpiId = "";
    this.kpis = [];
    this.loadKpisForDepartment();

    // Re-setup IntersectionObserver and scroll listener after department change
    setTimeout(() => {
      this.setupIntersectionObserver();
      this.setupScrollListener();
    }, 200);
  }

  onStatusChanged(): void {
    console.log("clicked", this.status);

    this.loadComments(); // Refresh the comments list

    // Re-setup IntersectionObserver and scroll listener after status change
    setTimeout(() => {
      this.setupIntersectionObserver();
      this.setupScrollListener();
    }, 200);
  }

  goToReport() {
    //pass the department id 
    console.log(this.selectedTabIndex);
    this.router.navigate(["/kpi"], { queryParams: { departmentId: this.selectedDepartmentId } });
  }

  // Manual method to test infinite scroll
  testLoadMore(): void {
    console.log("Manual test load more triggered");
    this.loadNextPage();
  }
  comments: CommentItem[] = [];
  statuses: string[] = [];
  status: string = "";

  sleep(ms: any) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ========= Infinite Scroll (client-side slice) =========
  allComments: CommentItem[] = [];
  visibleComments: CommentItem[] = [];
  pageNumber: number = 1;
  pageSize: number = 10;
  loadingMore: boolean = false;
  hasMore: boolean = true;

  @ViewChild("sentinel", { static: false })
  sentinelRef?: ElementRef<HTMLDivElement>;
  private io?: IntersectionObserver;
  private scrollListener?: () => void;

  ngAfterViewInit(): void {
    // Setup IntersectionObserver for infinite scroll
    setTimeout(() => {
      this.setupIntersectionObserver();
      this.setupScrollListener();
    }, 100);
  }

  private setupIntersectionObserver(): void {
    // Disconnect existing observer
    if (this.io) {
      this.io.disconnect();
    }

    if (this.sentinelRef) {
      console.log("Setting up IntersectionObserver for sentinel element");
      this.io = new IntersectionObserver(
        (entries) => {
          console.log("IntersectionObserver callback triggered");
          entries.forEach((entry) => {
            console.log("IntersectionObserver triggered:", {
              isIntersecting: entry.isIntersecting,
              hasMore: this.hasMore,
              loadingMore: this.loadingMore,
              intersectionRatio: entry.intersectionRatio,
              boundingClientRect: entry.boundingClientRect,
            });

            if (entry.isIntersecting && this.hasMore && !this.loadingMore) {
              console.log(
                "Sentinel element is intersecting, loading more comments..."
              );
              this.loadNextPage();
            } else if (entry.isIntersecting && !this.hasMore) {
              console.log(
                "Sentinel element is intersecting but no more comments available"
              );
            } else if (entry.isIntersecting && this.loadingMore) {
              console.log(
                "Sentinel element is intersecting but already loading"
              );
            }
          });
        },
        {
          root: null,
          rootMargin: "100px", // Start loading 100px before the sentinel comes into view
          threshold: 0.1,
        }
      );
      this.io.observe(this.sentinelRef.nativeElement);
    } else {
      console.log("Sentinel element not found");
    }
  }

  ngOnDestroy(): void {
    this.io?.disconnect();
    if (this.scrollListener) {
      window.removeEventListener("scroll", this.scrollListener);
    }
  }

  private setupScrollListener(): void {
    // Remove existing scroll listener
    if (this.scrollListener) {
      window.removeEventListener("scroll", this.scrollListener);
    }

    this.scrollListener = () => {
      if (
        !this.hasMore ||
        this.loadingMore ||
        !this.selectedDepartmentId ||
        !this.selectedKpiId
      ) {
        return;
      }

      // Check if user has scrolled near the bottom
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Trigger when user is within 200px of the bottom
      if (scrollTop + windowHeight >= documentHeight - 200) {
        console.log("Scroll listener triggered - near bottom of page");
        this.loadNextPage();
      }
    };

    window.addEventListener("scroll", this.scrollListener);
    console.log("Scroll listener setup complete");
  }

  private resetPagingAndSetInitial(): void {
    this.pageNumber = 1;
    // No need for client-side slicing since we're using server-side pagination
    this.visibleComments = this.allComments;
  }

  private loadNextPage(): void {
    console.log("loadNextPage called:", {
      hasMore: this.hasMore,
      loadingMore: this.loadingMore,
      selectedDepartmentId: this.selectedDepartmentId,
      selectedKpiId: this.selectedKpiId,
      pageNumber: this.pageNumber,
    });

    if (
      !this.hasMore ||
      this.loadingMore ||
      !this.selectedDepartmentId ||
      !this.selectedKpiId
    ) {
      console.log("loadNextPage: conditions not met, returning");
      return;
    }

    this.loadingMore = true;
    this.pageNumber += 1;
    console.log("Loading page:", this.pageNumber);

    // Make API call for next page
    this.departmentKpiApi
      .getDepartmentKpiComments(
        this.selectedDepartmentId,
        this.selectedKpiId,
        this.pageNumber,
        this.pageSize
      )
      .subscribe({
        next: (data: any) => {
          console.log("Load more comments API response:", data);
          let arr: any[] = [];
          let totalCount = 0;

          if (data && data.success && data.data) {
            arr = Array.isArray(data.data) ? data.data : data.data.items || [];
            totalCount = data.data.totalCount || 0;
          } else if (data && data.data) {
            arr = Array.isArray(data.data) ? data.data : data.data.items || [];
            totalCount = data.data.totalCount || 0;
          } else if (Array.isArray(data)) {
            arr = data;
            totalCount = data.length;
          } else if (data?.comments) {
            arr = data.comments;
            totalCount = data.comments.length;
          }

          const newComments = (arr as any[]).map((c: any) => {
            const deptId: string | undefined = c.departmentId || c.department?.id;
            const deptNameFromMap = deptId ? this.departmentIdToName.get(deptId) : undefined;
            const department = deptNameFromMap || c.departmentName || '';
            return {
              id: c.id,
              commentText: c.text,
              userName: c.addedBy,
              timestamp: c.addedAt,
              status: "Open",
              department
            } as CommentItem;
          });

          // Append new comments to existing ones
          this.allComments = [...this.allComments, ...newComments];
          this.visibleComments = this.allComments;

          // Check if there are more pages available
          const currentPage = this.pageNumber;
          const totalPages = Math.ceil(totalCount / this.pageSize);
          this.hasMore = currentPage < totalPages;
          this.loadingMore = false;
          this.comments = this.visibleComments;

          console.log("More comments loaded:", {
            loaded: this.allComments.length,
            total: totalCount,
            currentPage: currentPage,
            totalPages: totalPages,
            hasMore: this.hasMore,
            newCommentsCount: newComments.length,
          });
        },
        error: (error) => {
          console.error("Failed to load more comments:", error);
          this.loadingMore = false;
        },
      });
  }
  convertUrlString(url: string): string {
    // Remove any query parameters by splitting at "?"
    const baseUrl = url.split("?")[0];

    // Remove the "/reports/" prefix
    const withoutPrefix = baseUrl.replace("/comments/", "");

    // Decode any URL-encoded characters (e.g., '%20' to ' ')
    const decodedString = decodeURIComponent(withoutPrefix);

    // Capitalize each word
    const capitalized = decodedString
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return capitalized;
  }
}
