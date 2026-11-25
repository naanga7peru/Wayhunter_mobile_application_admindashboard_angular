import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import { UiButton } from '../../../shared/ui/button';
import {
  AdvertisementEditorField, AdvertisementEditorFields, advertisementPreviewFields,
  editorPlacements, validateAdvertisementEditor,
} from '../models/advertisement-editor';

@Component({
  selector: 'wayhunter-advertisement-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButton],
  templateUrl: './advertisement-editor.html',
  styles: `
    form, .field { display: grid; gap: .5rem; }
    form { gap: 1rem; }
    .field input, .field select { font: inherit; padding: .5rem; max-width: 40rem; }
    .field p { margin: 0; }
    [aria-invalid="true"] { outline: 2px solid currentColor; }
    dd { margin-inline-start: 0; overflow-wrap: anywhere; }
  `,
})
export class AdvertisementEditor {
  readonly initial = input.required<AdvertisementEditorFields>();
  protected readonly fields = linkedSignal(() => this.initial());
  protected readonly errors = computed(() => validateAdvertisementEditor(this.fields()));
  protected readonly checked = linkedSignal({ source: this.initial, computation: () => false });
  protected readonly preview = linkedSignal({
    source: this.initial,
    computation: (): AdvertisementEditorFields | null => null,
  });
  protected readonly placements: Record<typeof editorPlacements[number], string> = {
    HomeBanner: 'Home banner',
    SponsoredPoi: 'Sponsored POI',
  };
  protected readonly placementOptions = editorPlacements;
  protected readonly textFields = [
    { key: 'title', label: 'Title' },
    { key: 'imageUrl', label: 'Image URL' },
    { key: 'destinationUrl', label: 'Destination URL (optional)' },
    { key: 'startAtUtc', label: 'Start (UTC)' },
    { key: 'endAtUtc', label: 'End (UTC)' },
  ] as const;

  protected update(field: AdvertisementEditorField, value: string): void {
    this.fields.update(fields => ({ ...fields, [field]: value }));
    this.preview.set(null);
  }

  protected error(field: AdvertisementEditorField): string | undefined {
    return this.checked() ? this.errors()[field] : undefined;
  }

  protected submit(event: Event): void {
    event.preventDefault();
    this.checked.set(true);
    if (Object.keys(this.errors()).length === 0) {
      this.preview.set(advertisementPreviewFields(this.fields()));
    } else if (event.currentTarget instanceof HTMLFormElement) {
      // Error attributes render after submission. Use the validator result to focus now.
      const first = [...this.textFields.map(field => field.key), 'placement' as const]
        .find(field => this.errors()[field]);
      event.currentTarget.querySelector<HTMLElement>('#ad-editor-' + first)?.focus();
    }
  }
}
