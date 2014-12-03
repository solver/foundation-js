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
		 * Creates a deep copy of a tree containing simple types: Object, Array, number, string, boolean, null. For
		 * objects, custom prototypes (user classes) are supported. Custom prototypes are directly referenced in the new
		 * object, and not deep-cloned, only an object's own properties are deep cloned (this is what you would expect
		 * in an OOP language).
		 * 
		 * When cloning custom user classes/prototypes, do note the following restrictions:
		 * 
		 * - Your class (i.e. prototype) must support a nullary constructor (i.e. no arguments), which is invoked in
		 * order to create the clone (we don't use Object.create() so objects have the chance to initialize themselves).
		 * - After being created from a nullary constructor, this function will set properties on your object, cloned
		 * from all the own properties on the original object. Your object should behave properly in this situation.
		 * 
		 * Best candidates for such cloneable objects are C-struct like objects that simply act as data containers.
		 * Cloning objects with complex behaviors and primarily exposing an interface made of methods (not data) should
		 * not be a typical scenario, anyway.
		 * 
		 * Cloning is useful when passing C-struct like object as a parameter, or returning one as a function result, to
		 * ensure the other side can't modify your copy of it "magically from distance".
		 * 
		 * TODO: Support a static foo.prototype.getCloned(ownProperties) interface, as an alternative to nullary
		 * constructor + us directly setting properties. This would give objects even more control in initializing.
		 * 
		 * The subset of supported primitive and object types intentionally is a superset of the types you need to clone
		 * an object derived from JSON, so cloning structures derived from JSON is always safe.
		 * 
		 * The behavior of cloning objects from the internal types (HTMLElement etc.) is undefined at the moment. Don't
		 * do it, except for these tested and confirmed to work internal classes:
		 * 
		 * - null, Object, Array
		 * - Date (specific support is added, so it reflects the same datetime as the original).
		 * 
		 * We explicitly DO NOT support (and will never support):
		 * 
		 * - Number, Boolean, String (those are distinct from the number, boolean, string primitives which we support).
		 * 
		 * TODO: Test & support other common internal types and fix this documentation.
		 * 
		 * If your structure is big, you should wrap your data in a class and expose an API for accessing it instead.
		 * 
		 * TODO: Copy prototype, thus allowing cloning custom types (verify how this works with DOM & other native
		 * objects, however).
		 * 
		 * @param object
		 * Any object consisting of the basic types outlined above.
		 * 
		 * @param params.hashProperty
		 * Optional, default null.
		 * 
		 * Hashes are used for faster comparisons by ObjectUtils.compare(), and you can use empty objects as hashes to
		 * ensure their uniqueness (an object has a unique identity that can be checked via ===). To ensure this works
		 * well, the hash property shouldn't be cloned when you clone an object for later comparison, but referenced (or
		 * the two copies will never match as the hash in the clone will have its own identity).
		 * 
		 * Specify the hashProperty name you use to clone hash properties by reference and not by value.
		 * 
		 * @param params.stopCloneAtHash
		 * Optional, default null (interpreted as false).
		 * 
		 * If you have specified hashProperty and set stopCloneAtHash to true, object cloning will be partial: whenever
		 * the hashProperty is encountered in an object, only the hash will be copied (directly, and not recursively in
		 * case it's not a scalar) and the rest of that subtree will be skipped. Such partial hash-only copies of
		 * objects are useful (and entirely sufficient) for performing equals() checks between two objects using hashes,
		 * since equals() itself stops comparing other properties at a given level in the tree when it encounters a hash
		 * is available at the same level.
		 * 
		 * @return A deep
		 * clone of the input object.
		 * 
		 * @throws Error
		 * If your structure is too deep (TODO: specify max depth or expose param), to avoid cyclic references.
		 * 
		 * @throws Error
		 * If your object contains unsupported types (not one of the listed above).
		 */
		public static clone<T>(object: T, params: {hashProperty?: string; stopCloneAtHash?: boolean}): T {
			var hashProperty = params && params.hashProperty ? params.hashProperty : null;
			var stopCloneAtHash = params && params.stopCloneAtHash ? params.stopCloneAtHash : false;
			
			if (stopCloneAtHash && hashProperty === null) {
				throw new Error('You\'ve enabled stopCloneAtHash, but not set the hashProperty name.');
			}
			
			// TODO: Optimization. Instead of requiring a recursive call only to return the same thing passed for scalars,
			// inline that in the loop.
			function cloneRecursive(object: T, level: number): any {
				if (level > 16) {
					throw new Error('Went deeper than 16 levels. Reference loop?'); // TODO: Improve this error message, add maxDepth param.
				}
				
				var type = typeof object;
				
				// Scalars & null are returned directly as they're immutable (no need to copy them).
				if (object == null || type === 'string' || type === 'number' || type === 'boolean') {
					return object;
				}
				
				if (type === 'object') {
					var objectClone: any;
					
					// Construct. We have specialized construction and initialization code for some built-in types
					// (generic code path doesn't work reliably).
					if (object instanceof Array) {
						objectClone = [];
					} else if (object instanceof Date) {
						objectClone = new Date(); 
						(<Date>objectClone).setTime((<Date><any>object).getTime());
					} else {
						var p = Object.getPrototypeOf(object);
						var c = p.constructor;
						
						// We rely on cloned objects which aren't plain objects, to provide a nullary constructor.
						if (c === Object) {
							objectClone = {};
						} else {
							objectClone = new c();
						}
					}
					
					// Deep clone own properties (except hash, which is directly referenced /in order to support empty
					// object references as unique hash tokens/).
					if (hashProperty != null && object.hasOwnProperty(hashProperty)) {
						objectClone[hashProperty] = object[hashProperty];
					} else {
						for (var i in object) if (i !== hashProperty && object.hasOwnProperty(i)) {
							objectClone[i] = cloneRecursive(object[i], level + 1);
						}
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
		 * provide a special "hash" fingerprint for an object tree (or a subtree inside of it) to short-circuit the
		 * change detection. If an array, or an object (non-scalar) have a property with the name specified by
		 * hashPropertyName, the hashes at the respective locations of objectA and objectB will be compared in order to
		 * determine if any change has occurred.
		 *
		 * Also when you compare two objects that make uses of hashes, you don't need both (or either in fact) of them
		 * to contain a full copy of the data to be compared, just the hashes. See Object.clone() for information how
		 * to produce a partial clone of an object, stopping at places where a hash is found (and cloning only the
		 * hash).
		 * 
		 * Hash values are typically a scalar value, but you can also use a new empty object as a unique token. They'll
		 * be compared by identity (for scalars, they're compared strictly, i.e. in both cases === is used).
		 * 
		 * If one of the objects has a hash at a given location, and the other doesn't, this is considered "two
		 * different hashes", hence deepCompare() will return false (objectA and objectB are different).
		 * 
		 * Also, don't forget you can have the hash for an object computed on demand by defining the hash property as a
		 * getter function.
		 * 
		 * IMPORTANT: Be careful in the choice of a hash property, as those will not be considered normal properties of
		 * the object that the function will descend into and compare as usual values. You can use unlikely names like
		 * "__ID__" or "$FINGERPRINT", for example.
		 * 
		 * TODO: Test with & add official support for JavaScript's Symbol to ensure hash properties with no collisions.
		 * TODO: Implement compare(objectA, objectB, changeHandler: (path: Array<string>, from, to) => false);
		 * TODO: What about a handler to compare two values and say if they differ?
		 * 
		 * @return
		 * True if they match, false if they don't.
		 */
		public static equals(objectA: any, objectB: any, params: {hashProperty?: string}): boolean {
			var hashProperty = params && params.hashProperty ? params.hashProperty : null;
			
			// TODO: Optimization. Instead of requiring a recursive call only to return the same thing passed for scalars,
			// inline that in the loop.
			function compareRecursive(objectA: any, objectB: any, level: number): any {
				if (level > 16) {
					throw new Error('Went deeper than 16 levels. Reference loop?'); // TODO: Improve this error message, add maxDepth param.
				}
				
				// If a strict check is true, we know for sure things match up (and we don't have to descend into object
				// properties for objects as we know it's literally the same object).
				if (objectA === objectB) {
					return true;
				}
				
				// Special logic for null values. We don't differentiate the value "undefined" and "null" (JSON logic).
				if (objectA == null || objectB == null) {
					return objectA == objectB;
				}
				
				var typeA = typeof objectA;
				var typeB = typeof objectB;
				
				if (typeA !== typeB) {
					return false;
				}
				
				// Scalars are compared strictly (we already did that check above, we now just interpret the situation
				// where the comparison result for scalars was false).
				if (typeA === 'boolean' || typeA === 'number' || typeA === 'string') {
					return false;
				}

				if (typeA === 'object') {
					if (Object.getPrototypeOf(objectA) !== Object.getPrototypeOf(objectB)) {
						return false;
					}
					
					// Try to short-circuit compare via hashes.				
					if (hashProperty != null) {
						var hasHashA = objectA.hasOwnProperty(hashProperty);
						var hasHashB = objectB.hasOwnProperty(hashProperty);
						
						// One has a hash, the other doesn't. We consider them different.
						if (hasHashA !== hasHashB) {
							return false;
						}
						
						// Both have a hash.
						if (hasHashA) {
							// Identity comparison means empty objects can be used as unique fingerprints without the
							// need to track autoincrementing ids and so on. I.e. foo.__hash__ = {}, upon changing foo.
							return objectB[hashProperty] === objectA[hashProperty];
						}
					}
					
					var propCountA = 0;
					
					for (var i in objectA) if (i !== hashProperty && objectA.hasOwnProperty(i)) {
						propCountA++;
					}
					
					var propCountB = 0;
					
					for (var i in objectB) if (i !== hashProperty && objectB.hasOwnProperty(i)) {
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