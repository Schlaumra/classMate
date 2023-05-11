import { Pipe, PipeTransform } from '@angular/core';

/**
 * Returns a color based on the mark
 */
@Pipe({ name: 'colorMark' })
export class ColorMarkPipe implements PipeTransform {

  /**
   * Transform a mark to a color class
   * 
   * @param value mark from 0 to 10
   * @param onlyNegative color only under 6
   * @returns the css class
   */
  transform(value: number | null | unknown, onlyNegative = false): string {
    return value == 0 || value == null
      ? ''
      : value < 6
      ? 'focus-attention'
      : value < 6.5 && !onlyNegative
      ? 'focus-warn'
      : '';
  }
}
