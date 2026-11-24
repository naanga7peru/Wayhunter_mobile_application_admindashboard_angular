import { DatePipe, DecimalPipe } from '@angular/common';
import {
  afterNextRender, ChangeDetectionStrategy, Component, computed, ElementRef, inject, Injector,
  OnInit, signal, viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiButton } from '../../shared/ui/button';
import { UiCard } from '../../shared/ui/card';
import { TableColumn, UiDataTable } from '../../shared/ui/data-table';
import { UiFilterSelect } from '../../shared/ui/filter-select';
import { UiSearchInput } from '../../shared/ui/search-input';
import { UiEmptyState, UiErrorState, UiLoadingState } from '../../shared/ui/states';
import { StatusTone, UiStatusBadge } from '../../shared/ui/status-badge';
import { clickThroughRate } from '../advertisements/models/advertisements-view';
import {
  Campaign, CampaignAuditEvent, campaignCategories, CampaignsDemoSource, CampaignsSnapshot, campaignStatuses,
} from './campaigns-demo';

type ViewState =
  | { readonly kind: 'loading' | 'error' }
  | { readonly kind: 'ready'; readonly snapshot: CampaignsSnapshot };

type CampaignDraft = Pick<Campaign, 'title' | 'sponsor' | 'audience' | 'district' | 'start' | 'end'> & {
  category: string;
  contentId: string;
  budgetCoins: number | null;
};

function draftFrom(campaign: Campaign): CampaignDraft {
  const { title, sponsor, category, audience, district, start, end, budgetCoins } = campaign;
  return { title, sponsor, category, contentId: campaign.id, audience, district, start, end, budgetCoins };
}

function utcDate(value: string | undefined): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const iso = value + 'T00:00:00Z';
  const date = new Date(iso);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? iso : null;
}

const overviewCards = [
  { label: 'Total campaigns', tone: 'info' },
  { label: 'Active campaigns', status: 'Active', tone: 'success' },
  { label: 'Scheduled campaigns', status: 'Scheduled', tone: 'info' },
  { label: 'Pending review', status: 'Pending Review', tone: 'warning' },
  { label: 'Draft campaigns', status: 'Draft', tone: 'neutral' },
] satisfies readonly { label: string; status?: Campaign['status']; tone: StatusTone }[];

const utcTime = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC',
});

function options(allLabel: string, values: readonly string[]) {
  return [{ label: allLabel, value: '' }, ...values.map(value => ({ label: value, value }))];
}

function scheduleWindow(campaign: Campaign, asOf: string) {
  if (campaign.end < asOf) return 'Past window';
  if (campaign.start > asOf) return 'Upcoming window';
  return 'Current window';
}

@Component({
  standalone: true,
  selector: 'wayhunter-campaigns-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, UiButton, UiCard, UiDataTable, UiEmptyState, UiErrorState,
    UiFilterSelect, UiLoadingState, UiSearchInput, UiStatusBadge, ReactiveFormsModule],
  templateUrl: './campaigns.page.html',
  styleUrl: './campaigns.page.scss',
})
export class CampaignsPage implements OnInit {
  private readonly source = inject(CampaignsDemoSource);
  private readonly injector = inject(Injector);
  private readonly detailsHeading = viewChild<ElementRef<HTMLElement>>('detailsHeading');
  private readonly results = viewChild<ElementRef<HTMLElement>>('results');
  private readonly editorHeading = viewChild<ElementRef<HTMLElement>>('editorHeading');
  private readonly editButton = viewChild('editButton', { read: ElementRef<HTMLButtonElement> });
  private detailsTrigger?: HTMLElement;

  protected readonly state = signal<ViewState>({ kind: 'loading' });
  protected readonly search = signal('');
  protected readonly status = signal('');
  protected readonly category = signal('');
  protected readonly dateWindow = signal('');
  protected readonly selected = signal<Campaign | null>(null);
  protected readonly editing = signal(false);
  protected readonly submitted = signal(false);
  protected readonly maxBudget = Number.MAX_SAFE_INTEGER;
  private readonly savedDrafts = signal<ReadonlyMap<string, CampaignDraft>>(new Map());
  private readonly fb = inject(FormBuilder).nonNullable;
  protected readonly editor = this.fb.group({
    title: ['', [Validators.required, Validators.pattern(/.*\S.*/)]],
    sponsor: ['', Validators.required],
    category: ['', Validators.required],
    contentId: ['', Validators.required],
    start: ['', [Validators.required, ({ value }) => utcDate(value) ? null : { utcDate: true }]],
    end: ['', [Validators.required, ({ value }) => utcDate(value) ? null : { utcDate: true }]],
    audience: ['', Validators.required],
    district: [''],
    budgetCoins: this.fb.control<number | null>(null, [
      Validators.required,
      ({ value }) => value === null || (Number.isSafeInteger(value) && value >= 0) ? null : { wholeCoins: true },
    ]),
  }, {
    validators: ({ value }) => value.start && value.end && value.end <= value.start ? { dateOrder: true } : null,
  });
  private readonly editorValue = toSignal(this.editor.valueChanges);
  protected readonly ctr = clickThroughRate;
  protected readonly windowLabel = scheduleWindow;
  protected readonly tones: Record<Campaign['status'], StatusTone> = {
    Active: 'success', Scheduled: 'info', 'Pending Review': 'warning', Draft: 'neutral', Ended: 'neutral',
  };

  protected readonly statusOptions = options('All statuses', campaignStatuses);
  protected readonly categoryOptions = options('All categories', campaignCategories);
  protected readonly windowOptions = options('All sample dates', ['Current window', 'Upcoming window', 'Past window']);

  protected readonly snapshot = computed(() => {
    const state = this.state();
    return state.kind === 'ready' ? state.snapshot : null;
  });
  protected readonly campaigns = computed(() => this.snapshot()?.campaigns ?? []);
  protected readonly campaignTypes = campaignCategories;
  protected readonly sponsors = computed(() => [...new Set(this.campaigns().map(campaign => campaign.sponsor))]);
  protected readonly audiences = computed(() => [...new Set(this.campaigns().map(campaign => campaign.audience))]);
  protected readonly districts = computed(() => [...new Set(this.campaigns().map(campaign => campaign.district))]);
  protected readonly contentOptions = computed(() =>
    this.campaigns().filter(campaign => campaign.category === this.editorValue()?.category),
  );
  protected readonly savedDraft = computed(() => this.savedDrafts().get(this.selected()?.id ?? ''));
  protected readonly preview = computed(() => {
    const campaign = this.selected();
    if (!campaign) return null;
    const draft = this.editing() ? this.editorValue() : this.savedDraft() ?? draftFrom(campaign);
    if (!draft) return null;
    const content = this.campaigns().find(item => item.id === draft.contentId && item.category === draft.category);
    return { ...draft, content, startUtc: utcDate(draft.start), endUtc: utcDate(draft.end) };
  });
  protected readonly overview = computed(() => overviewCards.map(card => ({
    ...card,
    count: card.status
      ? this.campaigns().filter(campaign => campaign.status === card.status).length
      : this.campaigns().length,
  })));
  protected readonly filtered = computed(() => {
    const query = this.search().trim().toLowerCase();
    const status = this.status();
    const category = this.category();
    const dateWindow = this.dateWindow();
    const asOf = this.snapshot()?.asOf ?? '';
    return this.campaigns().filter(campaign =>
      (!status || campaign.status === status) &&
      (!category || campaign.category === category) &&
      (!dateWindow || scheduleWindow(campaign, asOf) === dateWindow) &&
      [campaign.id, campaign.title, campaign.sponsor, campaign.district].some(value => value.toLowerCase().includes(query)),
    );
  });
  protected readonly schedule = computed(() => [...this.campaigns()].sort((a, b) => a.start.localeCompare(b.start)));
  protected readonly pending = computed(() => this.campaigns().filter(campaign => campaign.status === 'Pending Review'));
  protected readonly associatedAds = computed(() => {
    const ids = this.selected()?.adIds ?? [];
    return this.snapshot()?.ads.filter(ad => ids.includes(ad.id)) ?? [];
  });
  protected readonly performance = computed(() => {
    const impressions = this.campaigns().reduce((sum, campaign) => sum + campaign.impressions, 0);
    const clicks = this.campaigns().reduce((sum, campaign) => sum + campaign.clicks, 0);
    return { impressions, clicks, ctr: clickThroughRate(clicks, impressions) };
  });
  protected readonly auditKey = (event: CampaignAuditEvent) => event.id;
  protected readonly auditColumns: readonly TableColumn<CampaignAuditEvent>[] = [
    { id: 'campaign', heading: 'Campaign', cell: row => row.campaignId },
    { id: 'event', heading: 'Event', cell: row => row.event },
    { id: 'actor', heading: 'Sample actor', cell: row => row.actor },
    { id: 'time', heading: 'Time (UTC)', cell: row => utcTime.format(new Date(row.at)) },
    { id: 'note', heading: 'Notes', cell: row => row.note },
  ];

  ngOnInit(): void {
    void this.load();
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
    this.category.set('');
    this.dateWindow.set('');
  }

  protected showDetails(campaign: Campaign, event: MouseEvent): void {
    this.editing.set(false);
    this.detailsTrigger = event.currentTarget instanceof HTMLButtonElement ? event.currentTarget : undefined;
    this.selected.set(campaign);
    afterNextRender({ write: () => this.detailsHeading()?.nativeElement.focus() }, { injector: this.injector });
  }

  protected closeDetails(): void {
    this.editing.set(false);
    this.selected.set(null);
    (this.detailsTrigger?.isConnected ? this.detailsTrigger : this.results()?.nativeElement)?.focus();
    this.detailsTrigger = undefined;
  }

  protected editCampaign(campaign: Campaign): void {
    if (!this.editing()) {
      this.editor.reset(this.savedDraft() ?? draftFrom(campaign));
      this.submitted.set(false);
      this.editing.set(true);
    }
    afterNextRender({ write: () => this.editorHeading()?.nativeElement.focus() }, { injector: this.injector });
  }

  protected changeCampaignType(): void {
    this.editor.controls.contentId.reset('');
  }

  protected saveDraft(campaign: Campaign): void {
    this.submitted.set(true);
    if (this.editor.invalid) return;
    const draft = this.editor.getRawValue();
    this.savedDrafts.update(drafts => new Map(drafts).set(campaign.id, { ...draft, title: draft.title.trim() }));
    this.closeEditor();
  }

  protected closeEditor(): void {
    this.editing.set(false);
    this.editButton()?.nativeElement.focus();
  }
}
