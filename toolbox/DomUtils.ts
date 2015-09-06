/// <reference path="../lib.ts" />

/**
 * DOM-related utilities.
 */
module solver.toolbox.DomUtils {
	"use strict";
		
	/**
	 * Encodes plain text for safe inclusion in HTML code.
	 */
	export function encodeText(str: string): string {
		// TODO: Optimize.
		return str
			.replace(/&/g, '&amp;')
	    	.replace(/>/g, '&gt;')
	    	.replace(/</g, '&lt;')
	    	.replace(/"/g, '&quot;')
	    	.replace(/'/g, '&#39;');
	}
	
	/**
	 * Sets up a handler that fires when a form control potentially changes. Checking if the value has really changed is
	 * up to the handler.
	 * 
	 * Set debounceMs to 0 to disable debouncing (you better have a change detector in place as you'll be getting a lot
	 * of redundant calls without debouncing).
	 *
	 * Depends on jQuery & the "debounce/throttle" jQuery plugin.
	 */
	export function onMaybeChanged(elementSet: JQuery, debounceMs: number, handler: (eventObject: JQueryEventObject) => void): void {
		var anyImmediateChange = 'cut copy paste mousedown mouseup click keydown keyup keypress change propertychange textInput textinput input focus blur';
		
		if (debounceMs > 0) {
			elementSet.on(anyImmediateChange, (<any>$).debounce(debounceMs, handler));
		} else {
			elementSet.on(anyImmediateChange, handler);
		}
	}
}