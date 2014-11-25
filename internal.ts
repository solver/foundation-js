/**
 * This module contains functionality that MUST NOT be used outside of Workspace's own code, as it's
 * intended for internal purposes, not part of the public API and subject to sudden and arbitrary
 * change, regardless of the Workspace version.
 */
 "use strict";

/**
 * Contains some navbar, form etc. initializations, which in the long term will probably be their own classes. For now,
 * they're here.
 *
 * External dependencies:
 *
 * - None yet.
 */
module solver.workspace.internal {
	/**
	 * Port of PHP's Workspace\Internal\StackUrlCodec. See that class for details on every method.
	 *
	 * IMPORTANT: If you update this code, make sure you also update the PHP version of it!
	 */
	export class StackUrlCodec {
		public static generate(stack: Array<{name: string; state: any}>): string {
			var url = '/';

			for (var i = 0, maxI = stack.length; i < maxI; i++) {
				var item = stack[i];

				url += encodeURIComponent(item.name);

				var state = item.state;

				if (state === undefined) {
					state = null;
				} else if (state === '') {
					state = null;
				} else if (state instanceof Array && state.length == 0) {
					state = null;
				} else if (state instanceof Object) {
					var length = 0;
					for (var k in state) if (state.hasOwnProperty(k)) {
						length++;
					}

					if (length == 0) state = null;
				}

				if (state !== null) {
					if (state instanceof Object) {
						var keys = [];

						for (var k in state) if (state.hasOwnProperty(k)) {
							keys.push(k);
						}

						keys.sort();

						for (var k: any = 0, maxK = keys.length; k < maxK; k++)  {
							var key = keys[k];
							var value = state[key];

							url += ';' + encodeURIComponent(key) + '=' + encodeURIComponent(value);
						}
					} else {
						url += ';' + encodeURIComponent(state);
					}
				}

				url += '/';
			}

			return url;
		}

		public static parse(url: string): Array<any> {
			var urlSegs: Array<string> = url.replace(/^\/+|\/+$/g, '').split('/');
			var stack = [];

			for (var k = 0, maxK = urlSegs.length; k < maxK; k++) {
				var component = urlSegs[k];
				var item;

				// No state.
				if (component.indexOf(';') == -1) {
					item = {
						name: component, // Names are enforced to be [a-z0-9-]+, no need to decode.
						state: null
					};
				}

				else {
					var fields = component.split(';');
					var state = {};

					for (var i = 1 /* Index 0 is the name. */, maxI = fields.length; i < maxI; i++) {
						var keyVal = fields[i].split('=');

						if (keyVal.length == 1) {
							// No equals sign, means state is string (but we can only have one nameless string in a state,
							// hence this is only valid with two fields: "name;state").
							if (maxI == 2) {
								if (fields[1] === '') throw new Error('Invalid stack URL format (empty state).');

								state = decodeURIComponent(fields[1]);
							} else {
								throw new Error('Invalid stack URL format (multiple state strings).');
							}
						} else {
							var key = keyVal[0];
							var value = keyVal[1];

							if (key === '') throw new Error('Invalid stack URL format (empty key).');
							if (!(key.match(/^[a-zA-Z]/))) throw new Error('Invalid stack URL format (keys must begin with a letter).');
							if (value === '') throw new Error('Invalid stack URL format (empty value).');

							state[decodeURIComponent(key)] = decodeURIComponent(value);
						}
					}

					item = {
						name: fields[0], // Names are enforced to be [a-z0-9-]+, no need to decode.
						state: state,
					};
				}

				if (item.name === '') throw new Error('Invalid stack URL format (empty component name).');
				stack.push(item);
			}

			return stack;
		}

		public static normalize(url: string): string {
			return StackUrlCodec.generate(StackUrlCodec.parse(url));
		}
	}

	/**
	 * Takes string name and return the object for it (say a class).
	 *
	 * Returns null if the name points to no existing object.
	 *
	 * @param name
	 * A dot delimiter string representing an absolute path to an object (from the global object).
	 *
	 * @return {any|null}
	 * The value for this name, or null if it doesn't exist.
	 */
	export function getObjectFromName(name: string): any {
		var segs = name.split('.');

		var object: any = window;

		for (var i = 0, maxI = segs.length; i < maxI; i++) {
			if (typeof object[segs[i]] === 'undefined') return null;			
			object = object[segs[i]];
		}

		return object;
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
				throw new Error
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

	interface ListenerIndexByEvent { [eventType: string]: Array<(event: Event) => void> };

	/**
	 * A reusable event broadcaster.
	 *
	 * You SHOULD NOT extend this class to use it, it intentionally publishes information for internal use, such as
	 * hasEventListeners() and dispatchEvent().
	 *
	 * Instead, use composition, and create proxies for the addEventListener() and removeEventListener() methods.
	 */
	export class EventDispatcherTrait {
		// TODO: If this is slow, the array can be replaced with a Map() instance, for platforms that support it.
		private listeners: {[type: string]: Array<(event: Event) => void>} = {};

		private validEventsIndex: {[type: string]: boolean} = {};

		constructor(validEvents: Array<string>) {
			var validEventsIndex = this.validEventsIndex;

			for (var i = 0, maxI = validEvents.length; i < maxI; i++) {
				validEventsIndex[validEvents[i]] = true;
			}
		}

		public addEventListener(type: string, listener: (event: Event) => void): void {
			this.callHandler(type, listener, this.addEventListenerInternal);
		}

		public removeEventListener(type: string, listener?: (event: Event) => void): void {
			this.callHandler(type, listener, this.removeEventListenerInternal);
		}

		public hasEventListeners(type: string): boolean {
			if (this.listeners.hasOwnProperty(type)) {
				return this.listeners[type].length ? true : false;
			} else {
				return false;
			}
		}

		public dispatchEvent(event: Event): void {
			if (!this.listeners.hasOwnProperty(event.type)) return;
			
			var listenersOfType = this.listeners[event.type];
			
			for (var i = 0, maxI = listenersOfType.length; i < maxI; i++) {
				listenersOfType[i](event);
			}
		}
		
		/**
		 * This method enables passing multiple event types in one string, like "foo bar baz".
		 */
		private callHandler(type: string, 
							listener: (event: Event) => void, 
							handler: (type: string, listener?: (event: Event) => void) => void) {
							
			var types = type.replace(/^\s+|\s+$/g, '').split(/\s+/g);
			
			for (var i = 0, maxI = types.length; i < maxI; i++) {
				var type = types[i];
				
				if (type === '') {
					throw new Error('Empty string is not a valid event type.');
				}
				
				handler.apply(this, [type, listener]);
			}
		}
		
		
		private addEventListenerInternal(type: string, listener: (event: Event) => void): void {
			if (!this.validEventsIndex.hasOwnProperty(type)) {
				throw new Error('Invalid event type "' + type + '".');
			}

			var listeners = listeners;

			if (!listeners.hasOwnProperty(type)) {
				listeners[type] = [];
			}

			var listenersOfType = listeners[type];

			// We won't add the same listener for the same event a second time.
			for (var i in listenersOfType) if (listenersOfType.hasOwnProperty(i)) {
				if (listenersOfType[i] === listener) return;
			}

			this.listeners[type].push(listener);
		}
			
		private removeEventListenerInternal(type: string, listener?: (event: Event) => void): void {
			if (!this.listeners.hasOwnProperty(type)) return;
	
			if (listener === undefined) {
				delete this.listeners[type];
			} else {
				var list = this.listeners[type];

				for (var k = 0, maxK = list.length; k < maxK; k++) {
					if (list[k] === listener) {
						list.splice(k, 1);
						// In addEventListener we ensure one reference to a listener per event type, so break is ok.
						break;
					}
				}
			}
		}
	}
	
	// Obsolete?
	export interface Event {
		type: string;
	}
	
	// Obsolete?
	export class WindowEvent implements Event {
		constructor(public type: string, public windowFullName: string) {
		}
	}
}
