/*
 * Copyright (C) 2011-2014 Solver Ltd. All rights reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at:
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */
 
 "use strict";
 
/*
 * VERSION 0.1.0
 */

// TODO: Split the TS source into multiple individual files per function and class.
module solver.lab {	
	/**
	 * TODO: This has become big enough, it should be a class.
	 *
	 * Allows JS submission of forms and display of validation errors without refreshing the page.
	 * 
	 * Depends on the jQuery Form Plugin (http://malsup.com/jquery/form/).
	 *
	 * @param form
	 * An HTML element or a jQuery element set.
	 * 
	 * TODO: Require precisely an HTML form element.
	 * 
	 * @param input
	 * An object with these properties:
	 *
	 * - beforeSubmit: Handler to run before submit happens.
	 * - onSuccess: Handler on success (receives parameter "response" with parsed response data).
	 * - onError: Handler on failure (receives parameter "response" with parsed response data).
	 * - responseType: Response type to expect (default is by guess). Note we only support 'json', 'xml', 'text' for 
	 * now. The other jQuery types are off-limits if you want them to work onError() as well. This is a technical
	 * limitation of the current code.
	 */
	export function ajaxForm(form: any, params: {
		beforeSubmit?: Function;
		onSuccess?: Function;
		onError?: Function;
		responseType?: string;
	}) {
		function beforeSubmitInternal() {
			var eventSlots = $('.-events', form);
			
			// Reset event contents.
			eventSlots.html('').hide();
			
			if (params.beforeSubmit) params.beforeSubmit();
		}
		
		function onSuccessInternal(data) {
			displayLog(data);
	
			if (params.onSuccess) params.onSuccess(data);
		}
		
		function onErrorInternal(jqXhr) {	
			// jQuery doesn't pass the parsed "data" on error, so we'll tease it out of the jqXHR object.
			// This is the reason we only support a subset of the jQuery responseType strings.
			var data = dataFromJqXhr(params.responseType, jqXhr);
		
			displayLog(data);
	
			if (params.onError) params.onError(data);
		}
	
		function displayLog(data) {
			function addEventToSlot(slot, event) {
				slot.show().append('<span class="event -' + event.type + '">' + esc(event.message) + '</span>');
			}
	
			if (typeof data === 'object' && data.log) {
				var eventSlots = $('.-events', form);
				var esc = solver.lab.escape;
					
				// Build an index of event fields to fill in.
				var eventSlotsByPath = {};
				
				for (var i = 0, l = eventSlots.length; i < l; i++) {
					eventSlotsByPath[eventSlots.eq(i).attr('data')] = eventSlots.eq(i);
				}
				
				// Fill in the events.
				if (data.log) for (var i = 0, l: number = data.log.length; i < l; i++) {
					var event = data.log[i];
					
					var path = event.path;
	
					// Every event tries to find its "best home" to be added to, in this order:
					// 
					// 1. An event in the exact slot it belongs in: data="path".
					// 2. An event slot with the exact path preceded by a ~ (read below to see what these do): data="~path".
					// 3. We start popping off path segments from right and try ~path until we find a match.
					// 4. If there's still no match by the time there are more dots in the path left, we give up.
					// 
					// The ~path syntax means "put here errors for this path and its descendant paths". You can choose to
					// use tilde to take advantage of this automatic routing, or remove the tilde to disable it.
					if (eventSlotsByPath[path]) {
						addEventToSlot(eventSlotsByPath[path], event);
					} else {
						while (!eventSlotsByPath['~' + path]) {
							var pathSegs = path.split('.');
	
							if (pathSegs.length > 1) {
								pathSegs.pop();
							} else {
								break;
							}
	
							path = pathSegs.join('.');
						}
	
						if (eventSlotsByPath['~' + path]) addEventToSlot(eventSlotsByPath['~' + path], event);
					}
				}
			}
		}
	
		function dataFromJqXhr(responseType, jqXhr) {
			if (typeof responseType === 'string') {
				if (responseType === 'xml' && jqXhr.responseXML) return jqXhr.responseXML;
				if (responseType === 'json' && jqXhr.responseJSON) return jqXhr.responseJSON;
				if (responseType === 'text' && jqXhr.responseText) return jqXhr.responseText;
			}
	
			// If no preference, return whatever is there, preferring structured types over plain text.
			if (jqXhr.responseXML) return jqXhr.responseXML;
			if (jqXhr.responseJSON) return jqXhr.responseJSON;
			if (jqXhr.responseText) return jqXhr.responseText;
	
			return null;
		}
		
		if (params.responseType) {
			if (params.responseType !== 'text' && params.responseType !== 'text' && params.responseType !== 'text') {
				throw new Error('Unsupported response type "' + params.responseType + '".');
			}
		}
		(<any>$(form)).ajaxForm({
			beforeSerialize: beforeSubmitInternal,
			dataType: params.responseType,
			error: onErrorInternal,
			success: onSuccessInternal
		});
	};
	
	export function escape(str: string) {
		// TODO: Optimize.
		return str
			.replace(/&/g, '&amp;')
	    	.replace(/>/g, '&gt;')
	    	.replace(/</g, '&lt;')
	    	.replace(/"/g, '&quot;')
	    	.replace(/'/g, '&#39;');
	}
	
	/**
	 * Creates a deep copy of a tree containing simple types: Object (as a dictionary), Array, number, string, boolean,
	 * null. For objects, it assumes they're used like dictionaries and ignores prototype properties and clones only own
	 * properties.
	 * 
	 * Use this when you have a C struct-like dictionary or array that you need to pass as a parameter, or return as 
	 * a result, ensuring the other side can't modify your copy of it "magically from distance".
	 *
	 * The subset of supported primitive and object types intentionally matches JSON, so Date instances etc. will lose
	 * their prototype.
	 *
	 * If your structure is big, you should wrap your data in a class and expose an API for accessing it instead.
	 *
	 * @param object
	 * Any object consisting of the basic types outlined above.
	 *
	 * @return
	 * A deep clone of the input object.
	 *
	 * @throws Error
	 * If your structure is too deep (TODO: specify max depth or expose param), to avoid cyclic references.
	 *
	 * @throws Error
	 * If your object contains unsupported types (not one of the listed above).
	 */
	export function deepClone<T>(object: T): T {
		// TODO: Optimization. Instead of requiring a recursive call only to return the same thing passed for scalars,
		// inline that in the loop.
		function cloneRecursive(object: T, level: number): any {
			if (level > 16) {
				throw new Error('Went deeper than 16 levels. Reference loop?');
			}
			
			// Scalars are return directly as they're immutable (no need to copy them).
			var type = typeof object;
			
			if (object == null || type === 'string' || type === 'number' || type === 'boolean') {
				return object;
			}
			
			if (type === 'object') {		
				var objectClone: any;
						
				if (object instanceof Array) {
					objectClone = [];
				} else {
					objectClone = {};
				}
				
				for (var i in object) if (object.hasOwnProperty(i)) {
					objectClone[i] = cloneRecursive(object[i], level + 1);
				}
				
				return objectClone;
			}
			
			throw new Error('The object is (or contains properties) of unsupported type "' + type + '".');
		}
		
		return cloneRecursive(object, 0);
	}
	
	/**
	 * Take two object trees (see deepClone for supported subset of types) and compares them recursively. 
	 * 
	 * Comparison are strict for scalars, but we don't differentiate a value set to undefined, and one set to null. We
	 * do differentiate an actually unset property from one set to undefined/null, however.
	 *
	 * Object prototype chains are ignored and only an object's direct properties are compared.
	 *
	 * @param objectA
	 *
	 * @param objectB
	 *
	 * @return
	 * True if they match, false if they don't.
	 */
	export function deepCompare<T>(objectA: T, objectB: T): T {
		// TODO: Optimization. Instead of requiring a recursive call only to return the same thing passed for scalars,
		// inline that in the loop.
		function compareRecursive(objectA: T, objectB: T, level: number): any {
			if (level > 16) {
				throw new Error('Went deeper than 16 levels. Reference loop?');
			}
			
			// Special logic for null values. We don't differentiate the value "undefined" and "null" (JSON logic).
			if ((objectA == null || objectB == null) && objectA == objectB) {
				return true;
			}
			
			// Scalars are compared directly.
			var typeA = typeof objectA;
			var typeB = typeof objectB;
			
			if (typeA !== typeB) {
				return false;
			}
			
			if (typeA === 'string' || typeA === 'number' || typeA === 'boolean') {
				return objectA === objectB;
			}
			
			if (typeA === 'object') {
				if (objectA instanceof Array && !(objectB instanceof Array)) {
					return false;
				}
				
				var propCountA = 0;
				
				for (var i in objectA) if (objectA.hasOwnProperty(i)) {
					propCountA++;
				}
				
				var propCountB = 0;
				
				for (var i in objectB) if (objectB.hasOwnProperty(i)) {
					propCountB++;
					
					if (!objectA.hasOwnProperty(i)) {
						return false;
					}
					
					if (!(compareRecursive(objectA[i], objectB[i], level + 1))) {
						return false;
					}
				}
				
				if (propCountA !== propCountB) return false;
				
				return true;
			}
			
			// TODO: A more detailed error report.
			throw new Error('One or both of the compared objects are, or contain properties of an unsupported type.');
		}
		
		return compareRecursive(objectA, objectB, 0);
	}
	
	/**
	 * Works similar to its PHP counterpart, used to quickly read deeply nested values in an object/array tree without
	 * painstaking manual checks if the key exists at every level.
	 */
	export class DataBox {
		private value: any;
		
		public constructor(object: any) {
			this.value = object;
		}
		
		/**
		 * Returns the value at the given object string key, or the default value, if there's no value at that key.
		 * 
		 * @param key
		 * Dot delimited key path to the value to read.
		 * 
		 * @param defaultValue
		 * Value to return if the request key path is not defined (if not specified, returns the JS undefined value).
		 * 
		 * @return
		 * The found value. If none was found returns the default value (or null, if not specified).
		 */
		public get(key: string, defaultValue: any): any {
			if (typeof defaultValue === 'undefined') defaultValue = undefined; // Maybe not needed, but just in case.
		
			var keySegs = key.split('.');
		
			var value = this.value;
		
			if (typeof value !== 'object') return defaultValue;
		
			for (var i = 0, m = keySegs.length; i < m; i++) {
				if (value === null || typeof value !== 'object') return defaultValue;
				if (typeof value[keySegs[i]] === 'undefined') return defaultValue;
				value = value[keySegs[i]];
			}
		
			return value;
		}
		
		public unbox(): any {
			return this.value;
		}
	}
	
	// This shouldn't really be called *array* utils in JS, it should be object utils or dict utils.
	export class ArrayUtils {
		/**
		 * Merges a tree of objects/arrays/scalars recursively, properties of the second replacing (or setting)
		 * properties of the first.
		 */
		public mergeRecursive(mergeTo: Array<any>, mergeFrom: Array<any>) {
			var merge = function (a, b) {
				for (var k in b) if (b.hasOwnProperty(k)) {
					var bv = b[k];
					if (typeof a.k !== 'undefined') {
						var av = a[k];
						if (typeof av === 'object' && typeof bv === 'object') {
							merge(av, bv);
						} else {
							av = bv;
						}
					} else {
						a[k] = bv;
					}
				}
			};
		
			merge(mergeTo, mergeFrom);
		}
		
		/**
		 * Takes input with keys delimited by dots and/or brackets such as:
		 * 
		 * {'foo.bar.baz' : 123} -or- {'foo[bar][baz]' : 123}}
		 *
		 * and returns an output such as:
		 *
		 * {'foo' : {'bar' : {'baz' : 123}}}
		 *
		 * IMPORTANT: The current implementation always produces Object instances, even if a set of keys might form a
		 * valid Array.
		 */
		public splitKeys(object: any): any {
			var bracketToDot = ArrayUtils.bracketToDot;
			var output = {};
		
			for (key in object) if (object.hasOwnProperty(key)) {
				var value = object[key];
				if (key.indexOf('[') > -1) key = bracketToDot(key);
				var key = key.split('.');
		
				var node = output;
		
				for (var i = 0, m = key.length; i < m; i++) {
					if (i < m - 1) {
						if (typeof node[key[i]] !== 'object') node[key[i]] = {};
						node = node[key[i]];
					} else {
						node[key[i]] = value;
					}
				};
			}
		
			return output;
		}
		
		/**
		 * Takes a bracket delimited path such as:
		 *
		 * "foo[bar][baz]"
		 *
		 * and returns a dot delimited path such as:
		 *
		 * "foo.bar.baz"
		 */
		public static bracketToDot(path: string): string {
			return path.replace(/[\[\]]+/g, '.').replace(/^\.+|\.+$/g, '');
		}
	}
}