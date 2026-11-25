import { DatePipe, DecimalPipe } from '@angular/common';
import {
  afterNextRender, ChangeDetectionStrategy, Component, computed, ElementRef, inject, Injector, isDevMode,
  OnDestroy, OnInit, signal, viewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UiButton } from '../../shared/ui/button';
import { UiCard } from '../../shared/ui/card';
import { TableColumn, UiDataTable } from '../../shared/ui/data-table';
import { FilterOption, UiFilterSelect } from '../../shared/ui/filter-select';
import { UiSearchInput } from '../../shared/ui/search-input';
import { UiEmptyState, UiErrorState, UiLoadingState } from '../../shared/ui/states';
import { StatusTone, UiStatusBadge } from '../../shared/ui/status-badge';
import { AdvertisementsDemoSource } from './data-access/advertisements-demo';
import { AdvertisementEditor } from './components/advertisement-editor';
import { AdvertisementEditorFields } from './models/advertisement-editor';
import {
  AdAuditEvent, Advertisement, AdvertisementsSnapshot, AdStatus, adStatuses, clickThroughRate, creativeTypes, placements,
} from './models/advertisements-view';

type ViewState =
  | { readonly kind: 'loading' | 'error' }
  | { readonly kind: 'ready'; readonly snapshot: AdvertisementsSnapshot };

interface LocalCreative {
  readonly name: string;
  readonly type: string;
  readonly size: number;
  readonly url?: string;
}

const imageTypes: Readonly<Record<string, string>> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
const sizeLimitMiB = 5;
const utc = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });

function filterOptions(label: string, values: readonly string[]): readonly FilterOption[] {
  return [{ label, value: '' }, ...values.map(value => ({ label: value, value }))];
}

@Component({
  selector: 'wayhunter-advertisements-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, UiButton, UiCard, UiDataTable, UiEmptyState, UiErrorState, UiFilterSelect,
    UiLoadingState, UiSearchInput, UiStatusBadge, AdvertisementEditor],
  templateUrl: './advertisements.page.html',
  styleUrl: './advertisements.page.scss',
})
export class AdvertisementsPage implements OnInit, OnDestroy {
  private readonly source = inject(AdvertisementsDemoSource);
  private readonly injector = inject(Injector);
  private readonly detailsHeading = viewChild<ElementRef<HTMLElement>>('detailsHeading');
  private readonly results = viewChild<ElementRef<HTMLElement>>('results');
  private readonly editorHeading = viewChild<ElementRef<HTMLElement>>('editorHeading');
  private detailsTrigger?: HTMLButtonElement;

  protected readonly demoPreview = isDevMode() && inject(ActivatedRoute).parent?.routeConfig?.path === 'preview';
  protected readonly draft = signal<{ title: string; fields: AdvertisementEditorFields } | null>(null);
  protected readonly state = signal<ViewState>({ kind: 'loading' });
  protected readonly search = signal('');
  protected readonly status = signal('');
  protected readonly creative = signal('');
  protected readonly placement = signal('');
  protected readonly range = signal('');
  protected readonly selected = signal<Advertisement | null>(null);
  protected readonly file = signal<LocalCreative | null>(null);
  protected readonly fileError = signal('');
  protected readonly previewUnavailable = signal(false);
  protected readonly sizeLimit = sizeLimitMiB;
  protected readonly ctr = clickThroughRate;

  protected readonly tones: Record<AdStatus, StatusTone> = {
    Draft: 'neutral', 'Pending Review': 'warning', Approved: 'success', Active: 'success',
    Scheduled: 'info', Paused: 'warning', Rejected: 'danger', Expired: 'neutral',
  };
  protected readonly statusOptions = filterOptions('All statuses', adStatuses);
  protected readonly creativeOptions = filterOptions('All creative types', creativeTypes);
  protected readonly placementOptions = filterOptions('All placements', placements);
  protected readonly dateOptions: readonly FilterOption[] = [
    { label: 'All sample dates', value: '' },
    { label: 'Last 7 sample days', value: '7' },
    { label: 'Last 30 sample days', value: '30' },
  ];
  protected readonly snapshot = computed(() => {
    const state = this.state();
    return state.kind === 'ready' ? state.snapshot : null;
  });
  protected readonly ads = computed(() => this.snapshot()?.ads ?? []);
  protected readonly pending = computed(() => this.ads().filter(ad => ad.status === 'Pending Review'));
  protected readonly metrics = computed(() => [
    { label: 'Total Advertisements', count: this.ads().length, icon: '▦', tone: 'info' },
    { label: 'Active Advertisements', count: this.ads().filter(ad => ad.status === 'Active').length, icon: '●', tone: 'success' },
    { label: 'Pending Review', count: this.pending().length, icon: '◷', tone: 'warning' },
    { label: 'Scheduled Advertisements', count: this.ads().filter(ad => ad.status === 'Scheduled').length, icon: '▤', tone: 'info' },
    { label: 'Paused Advertisements', count: this.ads().filter(ad => ad.status === 'Paused').length, icon: 'Ⅱ', tone: 'warning' },
  ]);
  protected readonly performance = computed(() => {
    const impressions = this.ads().reduce((sum, ad) => sum + ad.impressions, 0);
    const clicks = this.ads().reduce((sum, ad) => sum + ad.clicks, 0);
    const activePlacements = new Set(this.ads().filter(ad => ad.status === 'Active').map(ad => ad.placement)).size;
    return { impressions, clicks, ctr: clickThroughRate(clicks, impressions), activePlacements };
  });
  protected readonly previews = computed(() => creativeTypes.flatMap(creative => {
    const ad = this.ads().find(ad => ad.creative === creative);
    return ad ? [ad] : [];
  }));
  protected readonly filtered = computed(() => {
    const snapshot = this.snapshot();
    if (!snapshot) return [];
    const query = this.search().trim().toLowerCase();
    const status = this.status();
    const creative = this.creative();
    const placement = this.placement();
    const range = this.range();
    const earliest = range ? Date.parse(snapshot.asOf) - Number(range) * 86_400_000 : -Infinity;
    return snapshot.ads.filter(ad =>
      (!status || ad.status === status) && (!creative || ad.creative === creative) &&
      (!placement || ad.placement === placement) && Date.parse(ad.updatedAt) >= earliest &&
      [ad.id, ad.title, ad.advertiser].some(value => value.toLowerCase().includes(query)),
    );
  });
  protected readonly auditKey = (event: AdAuditEvent) => event.id;
  protected readonly auditColumns: readonly TableColumn<AdAuditEvent>[] = [
    { id: 'ad', heading: 'Advertisement', cell: row => row.adId },
    { id: 'event', heading: 'Event', cell: row => row.event },
    { id: 'previous', heading: 'Previous status', cell: row => row.previous },
    { id: 'next', heading: 'New status', cell: row => row.next },
    { id: 'reviewer', heading: 'Sample reviewer', cell: row => row.reviewer },
    { id: 'time', heading: 'Time (UTC)', cell: row => utc.format(new Date(row.at)) },
    { id: 'notes', heading: 'Review notes', cell: row => row.notes },
  ];

  ngOnInit(): void {
    void this.load();
  }

  ngOnDestroy(): void {
    this.clearFile();
  }

  protected async load(): Promise<void> {
    this.state.set({ kind: 'loading' });
    try {
      this.state.set({ kind: 'ready', snapshot: await this.source.load() });
    } catch {
      this.state.set({ kind: 'error' });
    }
  }

  protected resetFilters(): void {
    this.search.set('');
    this.status.set('');
    this.creative.set('');
    this.placement.set('');
    this.range.set('');
  }

  protected showDetails(ad: Advertisement, event: MouseEvent): void {
    this.detailsTrigger = event.currentTarget instanceof HTMLButtonElement ? event.currentTarget : undefined;
    this.selected.set(ad);
    afterNextRender({ write: () => this.detailsHeading()?.nativeElement.focus() }, { injector: this.injector });
  }

  protected closeDetails(): void {
    this.selected.set(null);
    (this.detailsTrigger?.isConnected ? this.detailsTrigger : this.results()?.nativeElement)?.focus();
    this.detailsTrigger = undefined;
  }

  protected openDraft(ad?: Advertisement): void {
    this.draft.set({
      title: ad ? 'Edit sample advertisement ' + ad.id : 'Create sample advertisement',
      fields: {
        title: ad?.title ?? '',
        imageUrl: '',
        destinationUrl: '',
        startAtUtc: ad ? ad.start + 'T00:00:00Z' : '',
        endAtUtc: ad ? ad.end + 'T00:00:00Z' : '',
        placement: ad?.placement === 'Home banner' ? 'HomeBanner' : '',
      },
    });
    afterNextRender({ write: () => this.editorHeading()?.nativeElement.focus() }, { injector: this.injector });
  }

  protected selectFile(input: HTMLInputElement): void {
    this.clearFile();
    const file = input.files?.[0];
    if (!file) return;

    const extension = /\.([^.]+)$/.exec(file.name)?.[1].toLowerCase() ?? '';
    const mime = Object.hasOwn(imageTypes, extension) ? imageTypes[extension] : undefined;
    if (!mime || (file.type && file.type !== mime)) {
      this.fileError.set('Choose a PNG, JPEG or WebP image.');
    } else if (file.size === 0 || file.size > sizeLimitMiB * 1024 * 1024) {
      this.fileError.set('Choose a non-empty image no larger than ' + sizeLimitMiB + ' MiB.');
    } else {
      const url = typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : undefined;
      this.file.set({ name: file.name, type: mime, size: file.size, url });
    }
    if (this.fileError()) input.value = '';
  }

  protected clearFile(input?: HTMLInputElement): void {
    const url = this.file()?.url;
    if (url) URL.revokeObjectURL(url);
    if (input) input.value = '';
    this.file.set(null);
    this.fileError.set('');
    this.previewUnavailable.set(false);
  }
}
