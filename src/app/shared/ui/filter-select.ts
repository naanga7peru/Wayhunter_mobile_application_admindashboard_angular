import {
  afterRenderEffect, booleanAttribute, ChangeDetectionStrategy, Component, ElementRef, input, model, viewChild,
} from '@angular/core';

export interface FilterOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

@Component({
  selector: 'wh-filter-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './field.scss',
  template: `
    <label>
      {{ label() }}
      <select #field [disabled]="disabled()" (change)="value.set(field.value)">
        @for (option of options(); track option.value) {
          <option [value]="option.value" [disabled]="option.disabled ?? false">{{ option.label }}</option>
        }
      </select>
    </label>
  `,
})
export class UiFilterSelect {
  readonly label = input.required<string>();
  readonly options = input.required<readonly FilterOption[]>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly value = model('');

  private readonly field = viewChild.required<ElementRef<HTMLSelectElement>>('field');

  constructor() {
    afterRenderEffect({
      write: () => {
        // Apply the selection after Angular has rendered any new options.
        const value = this.value();
        const selected = this.options().findIndex(option => option.value === value);
        this.field().nativeElement.selectedIndex = selected;
      },
    });
  }
}
