import { Pipe, PipeTransform } from '@angular/core';
/*
 * Raise the value exponentially
 * Takes an exponent argument that defaults to 1.
 * Usage:
 *   value | exponentialStrength:exponent
 * Example:
 *   {{ 2 | exponentialStrength:10 }}
 *   formats to: 1024
 */
@Pipe({ name: 'colorMark' })
export class ColorMarkPipe implements PipeTransform {
  transform(value: number | null | unknown): string {
    return value == 0 || value == null
      ? ''
      : value < 6
      ? 'focus-attention'
      : value < 7
      ? 'focus-warn'
      : '';
  }
}
