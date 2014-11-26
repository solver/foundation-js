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

module solver.lab {
	/**
	 * Common utilities for operating with primitives and objects.
	 */
	export class ObjectUtils {
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
		public static clone<T>(object: T): T {
			// TODO: Optimization. Instead of requiring a recursive call only to return the same thing passed for scalars,
			// inline that in the loop.
			function cloneRecursive(object: T, level: number): any {
				if (level > 16) {
					throw new Error('Went deeper than 16 levels. Reference loop?'); // TODO: Improve this error message, add maxDepth param.
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
		 * Takes two object trees (see deepClone for supported subset of types) and compares them for matching contents
		 * recursively.
		 * 
		 * Comparisons are strict for scalars, but we don't differentiate a value set to undefined, and one set to null.
		 * We do differentiate an actually unset property from one set to undefined/null, however.
		 * 
		 * Object's prototype is compared for identity (i.e. same type), and only the object's direct properties are
		 * compared individually.
		 * 
		 * @param objectA
		 * 
		 * @param objectB
		 * 
		 * @param params.hashProperty
		 * Optional, default null.
		 * 
		 * Comparing deeply nested objects and arrays can be expensive, so instead of recursing into them, you can
		 * provide a special "hash" to short-circuit the change detection. If an array, or an object (non-scalar) have a
		 * property with the name specified by hashPropertyName, the hashes at the respective locations of objectA and
		 * objectB will be compared in order to determine if any change has occurred.
		 * 
		 * Hash values are typically a scalar value, but you can also use a new empty object as a unique token. They'll
		 * be compared by identity (for scalars, they're compared strictly, i.e. in both cases === is used).
		 * 
		 * If one of the objects has a hash at a given location, and the other doesn't, this is considered "two
		 * different hashes", hence deepCompare() will return false (objectA and objectB are different).
		 * 
		 * IMPORTANT: Be careful in the choice of a hash property, as those will not be considered normal properties of
		 * the object that the function will descend to and compare as usual values. You can use unlikely names like
		 * "__hash__" for example 
		 *
		 * TODO: Test with & add official support for JavaScript's Symbol to ensure hash properties with no collisions.
		 * 
		 * @return True if they match, false if they don't.
		 */
		public static equals(objectA: any, objectB: any, params: {hashProperty?: string}): boolean {
			var hashProperty = params.hashProperty == null ? null : params.hashProperty;
			
			// TODO: Optimization. Instead of requiring a recursive call only to return the same thing passed for scalars,
			// inline that in the loop.
			function compareRecursive(objectA: any, objectB: any, level: number): any {
				if (level > 16) {
					throw new Error('Went deeper than 16 levels. Reference loop?'); // TODO: Improve this error message, add maxDepth param.
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
					if (Object.getPrototypeOf(objectA) !== Object.getPrototypeOf(objectB)) {
						return false;
					}
					
					// Short-circuit comparison via hashes (hashes are always compared via ===, no recursive check).
					if (hashProperty != null) {
						if (objectA.hasOwnProperty(hashProperty)) {
							if (objectB.hasOwnProperty(hashProperty)) {
								return objectA[hashProperty] === objectB[hashProperty];
							} else {
								return false;
							}
						}
						
						if (objectB.hasOwnProperty(hashProperty)) {
							if (objectA.hasOwnProperty(hashProperty)) {
								return objectA[hashProperty] === objectB[hashProperty];
							} else {
								return false;
							}
						}
					}
					
					var propCountA = 0;
					
					for (var i in objectA) if (objectA.hasOwnProperty(i) && i !== hashProperty) {
						propCountA++;
					}
					
					var propCountB = 0;
					
					for (var i in objectB) if (objectB.hasOwnProperty(i) && i !== hashProperty) {
						propCountB++;
						
						if (!objectA.hasOwnProperty(i)) {
							return false;
						}
						
						if (!compareRecursive(objectA[i], objectB[i], level + 1)) {
							return false;
						}
					}
					
					if (propCountA !== propCountB) return false;
					
					return true;
				}
				
				// TODO: A more detailed error report.
				// TODO: Can't we support all types? See what types there are, and if there are any gotchas about DOM
				// objects and other native C objects exposed to JS.
				throw new Error('One or both of the compared objects are, or contain properties of an unsupported type.');
			}
			
			return compareRecursive(objectA, objectB, 0);
		}
	}
}