import { booleanAttribute, ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  selector: 'wh-search-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './field.scss',
  template: `
    <label>
      {{ label() }}
      <input #field type="search" [value]="value()" [placeholder]="placeholder()"
             [disabled]="disabled()" (input)="value.set(field.value)" />
    </label>
  `,
})
export class UiSearchInput {
  readonly label = input('Search');
  readonly placeholder = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly value = model('');
}
