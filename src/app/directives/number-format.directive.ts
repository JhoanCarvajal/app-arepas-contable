import { Directive, HostListener, ElementRef, Self } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appNumberFormat]',
  standalone: true,
})
export class NumberFormatDirective {

  constructor(private elementRef: ElementRef) {}

  @HostListener('input', ['$event'])
  onInput(event: any) {
    const value = event.target.value;
    if (value === null || value === '' || value === '-') {
      return;
    }

    // 1. Get only the numeric value from the input
    let numericValue = value.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      numericValue = parts[0] + '.' + parts.slice(1).join('');
    }

    // 2. Format the number for display
    const [integerPart, decimalPart] = numericValue.split('.');
    const formattedInteger = new Intl.NumberFormat('en-US').format(parseInt(integerPart, 10) || 0);
    
    let formattedValue = formattedInteger;
    if (decimalPart !== undefined) {
      formattedValue += '.' + decimalPart.substring(0, 2);
    }

    // 3. Update the view value
    this.elementRef.nativeElement.value = formattedValue;
  }
}
