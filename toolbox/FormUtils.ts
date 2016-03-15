/**
 * Form-related utilities.
 */
namespace solver.toolbox.FormUtils {
	"use strict";
	
	/**
	 * - Serialize form with dots or brackets to object tree.
	 * - Take object tree, unroll to brackets, make FormData.
	 * - Submit XHR with the FormData, decode response (text, JSON, XML).
	 * 
	 * Maybe we don't need jQuery.
	 */
		
	/**
	 * Converts form data to an object, using PHP brackets and dots as a convention for marking up keys deeper into 
	 * the object i.e. name your field "foo[bar][baz]" or "foo.bar.baz" to create a deep key in the object (at 
	 * foo.bar.baz), and use "foo[]" or "foo.*" to push a new value to an array at the given key.
	 */
	export function formToObject(form: HTMLFormElement): any {
		var data = getFormData(form);
		var obj = {};
		
		for (var keyVal of data) {
			var [key, val] = keyVal;
			embed(key, val, obj);
		}
		
		return obj;
	}
	
	/**
	 * Converts a form to FormData representing that data structure.
	 * 
	 * PHP bracket conventions are used to describe deep keys and arrays (i.e. foo.bar.baz becomes "foo[bar][baz]").
	 */
	export function serializeForm(form: HTMLFormElement): FormData {
		return serializeObject(formToObject(form));
	}
	
	/**
	 * Converts a tree of objects/arrays/scalars into a FormData representing that data structure.
	 * 
	 * PHP bracket conventions are used to describe deep keys and arrays (i.e. foo.bar.baz becomes "foo[bar][baz]").
	 */
	export function serializeObject(object: any): FormData {
		var data = new FormData();
		
		var scan = (value: any, path: string[]) => {			
			if (value == null) return;
			
			if (value instanceof Array) {
				for (var i = 0, m = value.length; i < m; i++) {
					scan(value[i], [].concat(path, [i]));
				}
				return;
			}
			
			if (value instanceof Object && !(value instanceof File)) {
				for (var k in value) if (value.hasOwnProperty(k)) {
					scan(value[k], [].concat(path, [k]));
				}
				return;
			}
			
			// TODO: This converts correctly, but it's a bit messy. Clean it up.
			var name = (path.join('][') + ']').replace(']', '');
			
			data.append(name, value);
		};

		scan(object, []);
		
		return data;
	}
	
	function bracketToDot(name: string): string {
		// TODO: This is quite sloppy, we need to refine. But it works. Covnerts PHP field notation like:
		// "foo[bar][baz][123][]" to dot notation like "foo.bar.baz.123.*".
		return name.replace(/\[\]/g, '.*').replace(/[\[\]]+/g, '.').replace(/\.{2,}/g, '.').replace(/^\.|\.$/g, '');
	}
	
	function embed(path: string, value: any, target: any) {
		var keys = bracketToDot(path).split('.');
		var lastKey = keys[0];
		
		if (lastKey == '*') {
			throw new Error('You cannot push to the root.');
		}
		
		for (var i = 1, m = keys.length; i < m; i++) {
			var key = keys[i];
		
			// Special key, means "push to array"
			if (key === '*') {
				if (!(target[lastKey] instanceof Array)) target[lastKey] = [];
				key = target[lastKey].length;
			} else {
				if (target[lastKey] == null) target[lastKey] = {};
			}
			
			target = target[lastKey];
			lastKey = key;
		}
		
		target[lastKey] = value;
	}
		
	/**
	 * Reads all form data to a list of [key, value] tuples. 
	 * 
	 * This is similar to what "new FormData(form)" does, but since the read methods of FormData are currently only
	 * supported on Gecko, we need to emulate it and write to an array, so we can read from it afterwards...
	 * 
	 * TODO: Use "new FormData(form)" to produce this array when there's wider support in browsers, and use current code
	 * as a fallback only.
	 */
	function getFormData(form: HTMLFormElement): Array<[string, string|File]> {
		var data: Array<[string, string|File]> = [];
		
		for (var el of $('input, select, textarea', form).toArray()) {
			if (el.disabled) continue;
			
			switch (el.tagName.toLowerCase()) {
				case 'input':
					if (el.type === 'file') {
						for (var file of el.files) {
							data.push([el.name, file]);
						}
					} else if (el.type === 'checkbox' || el.type === 'radio') {
						if (el.checked) data.push([el.name, el.value]);
					} else {
						data.push([el.name, el.value]);
					}
					break;
					
				case 'textarea':
					data.push([el.name, el.value]);
					break;
				
				case 'select': 
					if (el.multiple) { 
						for (var option of el.options) if (!option.disabled && option.selected) {
							data.push([el.name, option.value]);
						}
					} else {
						var index = el.selectedIndex;
						if (index > -1) data.push([el.name, el.options[el.selectedIndex].value]);
					}
					break;
					
				default: 
					throw new Error('Unexpected field tag name "' + el.tagName + '".');
			}
		}
		
		return data;
	}
}