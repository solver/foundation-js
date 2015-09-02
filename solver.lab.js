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
var solver;
(function (solver) {
    var lab;
    (function (lab) {
        /**
         * Common utilities for operating with primitives and objects.
         */
        var ObjectUtils = (function () {
            function ObjectUtils() {
            }
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
             * @param params.metaProperty
             * Optional, default "__meta__" (pass null to disable meta property support).
             *
             * The meta property holds an object with meta properties for the data at that object. Currently the only
             * supported property is "id", which is referred forward as "hash"
             *
             * FIXME: The comments from this point on...
             *
             * Hashes are used for faster comparisons by ObjectUtils.compare(), and you can use empty objects as hashes to
             * ensure their uniqueness (an object has a unique identity that can be checked via ===). To ensure this works
             * well, the hash property shouldn't be cloned when you clone an object for later comparison, but referenced (or
             * the two copies will never match as the hash in the clone will have its own identity).
             *
             * @param params.stopAtId
             * Optional, default = false.
             *
             * If you have specified an id for an object in its meta property and set stopAtId to true, object cloning
             * will be partial: whenever an id is encountered in an object, only the id will be transferred in the clone.
             * Such partial id-only "clones" of the object are sufficient for performing equals() checks between two objects
             * using ids, since equals() itself stops comparing other properties at a given level in the tree when it
             * encounters an id is available.
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
            ObjectUtils.clone = function (object, params) {
                var metaProperty = params && params.hasOwnProperty('metaProperty') ? params.metaProperty : '__meta__';
                var stopAtId = params && params.hasOwnProperty('stopAtId') ? params.stopAtId : false;
                if (stopAtId && metaProperty === null) {
                    throw new Error('You\'ve enabled stopAtId, but have disabled meta properties (metaProperty is null).');
                }
                // TODO: Optimization. Instead of requiring a recursive call only to return the same thing passed for scalars,
                // inline that in the loop.
                function cloneRecursive(object, level) {
                    if (level > 16) {
                        throw new Error('Went deeper than 16 levels. Reference loop?');
                    }
                    var type = typeof object;
                    // Scalars & null are returned directly as they're immutable (no need to copy them).
                    if (object == null || type === 'string' || type === 'number' || type === 'boolean') {
                        return object;
                    }
                    if (type === 'object') {
                        var objectClone;
                        // Construct. We have specialized construction and initialization code for some built-in types
                        // (generic code path doesn't work reliably).
                        if (object instanceof Array) {
                            objectClone = [];
                        }
                        else if (object instanceof Date) {
                            objectClone = new Date(+object);
                        }
                        else {
                            var p = Object.getPrototypeOf(object);
                            var c = p.constructor;
                            // We rely on cloned objects which aren't plain objects, to provide a nullary constructor.
                            if (c === Object) {
                                objectClone = {};
                            }
                            else {
                                objectClone = new c();
                            }
                        }
                        // Deep clone own properties (except meta, which is handled in a special way).
                        if (metaProperty != null && object.hasOwnProperty(metaProperty)) {
                            objectClone[metaProperty] = cloneMeta(object[metaProperty]);
                        }
                        else {
                            for (var i in object)
                                if (i !== metaProperty && object.hasOwnProperty(i)) {
                                    objectClone[i] = cloneRecursive(object[i], level + 1);
                                }
                        }
                        return objectClone;
                    }
                    throw new Error('The object is (or contains properties) of unsupported type "' + type + '".');
                }
                function cloneMeta(meta) {
                    var metaClone = {};
                    // We need to directly reference the id in the clone, not clone it, so we can preserve the identity of
                    // empty objects, used as unique id tokens (every new object has a unique identity, checked with ===).
                    if (meta.hasOwnProperty('id')) {
                        metaClone.id = meta.id;
                    }
                    return metaClone;
                }
                return cloneRecursive(object, 0);
            };
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
             * @param params.metaProperty
             * Optional, default "__meta__" (pass null to disable meta property support).
             *
             * The meta property is an object with meta data about the object that holds it. Right now the only meta
             * property supported is "id", which is referred to as "hash" from this point on.
             *
             * FIXME: Update the rest of the comments (from this line below).
             *
             * Comparing deeply nested objects and arrays can be expensive, so instead of recursing into them, you can
             * provide a special "hash" fingerprint for an object tree (or a subtree inside of it) to short-circuit the
             * change detection. If an array, or an object (non-scalar) have a property with the name specified by
             * metaPropertyName, the hashes at the respective locations of objectA and objectB will be compared in order to
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
            ObjectUtils.equals = function (objectA, objectB, params) {
                var metaProperty = params && params.hasOwnProperty('metaProperty') ? params.metaProperty : '__meta__';
                // TODO: Optimization. Instead of requiring a recursive call only to return the same thing passed for scalars,
                // inline that in the loop.
                function compareRecursive(objectA, objectB, level) {
                    if (level > 16) {
                        throw new Error('Went deeper than 16 levels. Reference loop?');
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
                        // Try to short-circuit compare via meta id.				
                        if (metaProperty != null) {
                            var hasIdA = objectA.hasOwnProperty(metaProperty) && objectA[metaProperty].hasOwnProperty('id');
                            var hasIdB = objectB.hasOwnProperty(metaProperty) && objectB[metaProperty].hasOwnProperty('id');
                            // One has an id, the other doesn't. We consider them different.
                            if (hasIdA !== hasIdB) {
                                return false;
                            }
                            // Both have an id.
                            if (hasIdA) {
                                // Identity comparison means empty objects can be used as unique fingerprints without the
                                // need to track autoincrementing ids and so on: foo.__meta__.id = {}, upon changing foo.
                                return objectB[metaProperty].id === objectA[metaProperty].id;
                            }
                        }
                        var propCountA = 0;
                        for (var i in objectA)
                            if (i !== metaProperty && objectA.hasOwnProperty(i)) {
                                propCountA++;
                            }
                        var propCountB = 0;
                        for (var i in objectB)
                            if (i !== metaProperty && objectB.hasOwnProperty(i)) {
                                propCountB++;
                                if (!objectA.hasOwnProperty(i)) {
                                    return false;
                                }
                                if (!compareRecursive(objectA[i], objectB[i], level + 1)) {
                                    return false;
                                }
                            }
                        if (propCountA !== propCountB)
                            return false;
                        return true;
                    }
                    throw new Error('One or both of the compared objects are, or contain properties of an unsupported type.');
                }
                return compareRecursive(objectA, objectB, 0);
            };
            return ObjectUtils;
        })();
        lab.ObjectUtils = ObjectUtils;
    })(lab = solver.lab || (solver.lab = {}));
})(solver || (solver = {}));
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
// TODO: The rest of the symbols in this file should go into multiple individual files per function and class.
var solver;
(function (solver) {
    var lab;
    (function (lab) {
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
        function ajaxForm(form, params) {
            function beforeSubmitInternal() {
                var eventSlots = $('.-events', form);
                // Reset event contents (mostly to indicate a form is being processed, as displaying the log reset them again).
                eventSlots.html('').hide();
                if (params.beforeSubmit)
                    params.beforeSubmit();
            }
            function onSuccessInternal(data) {
                if (params.onSuccess)
                    params.onSuccess(data);
            }
            function onErrorInternal(jqXhr) {
                // jQuery doesn't pass the parsed "data" on error, so we'll tease it out of the jqXHR object.
                // This is the reason we only support a subset of the jQuery responseType strings.
                var log = dataFromJqXhr(params.responseType, jqXhr);
                displayLog(log);
                if (params.onError)
                    params.onError(log);
            }
            function displayLog(log) {
                function addEventToSlot(slot, event) {
                    slot.show().append('<span class="event -' + event.type + '">' + esc(event.message) + '</span>');
                }
                if (log instanceof Array) {
                    var eventSlots = $('.-events', form);
                    var esc = solver.lab.escape;
                    // Reset event contents.
                    eventSlots.html('').hide();
                    // Build an index of event fields to fill in.
                    var eventSlotsByPath = {};
                    for (var i = 0, l = eventSlots.length; i < l; i++) {
                        var path = eventSlots.eq(i).attr('data');
                        if (path === null)
                            path = '';
                        eventSlotsByPath[eventSlots.eq(i).attr('data')] = eventSlots.eq(i);
                    }
                    // Fill in the events.
                    if (log)
                        for (var i = 0, l = log.length; i < l; i++) {
                            var event = log[i];
                            var path = event.path;
                            if (path == null)
                                path = '';
                            // Every event tries to find its "best home" to be added to, in this order:
                            // 
                            // 1. An event in the exact slot it belongs in: data="path".
                            // 2. An event slot with the exact path preceded by a ~ (read below to see what these do): data="~path".
                            // 3. We start popping off path segments from right and try ~path until we find a match.
                            // 4. If there's still no match by the time we pop off all path segments (matcing data="~"), we give up.
                            // 
                            // The ~path syntax means "put here errors for this path and its descendant paths". You can choose to
                            // use tilde to take advantage of this automatic routing, or remove the tilde to disable it.
                            if (eventSlotsByPath[path]) {
                                addEventToSlot(eventSlotsByPath[path], event);
                            }
                            else {
                                for (;;) {
                                    if (eventSlotsByPath['~' + path]) {
                                        addEventToSlot(eventSlotsByPath['~' + path], event);
                                        break;
                                    }
                                    if (path === '')
                                        break;
                                    var pathSegs = path.split('.');
                                    pathSegs.pop();
                                    path = pathSegs.join('.');
                                }
                            }
                        }
                }
            }
            function dataFromJqXhr(responseType, jqXhr) {
                if (typeof responseType === 'string') {
                    if (responseType === 'xml' && jqXhr.responseXML)
                        return jqXhr.responseXML;
                    if (responseType === 'json' && jqXhr.responseJSON)
                        return jqXhr.responseJSON;
                    if (responseType === 'text' && jqXhr.responseText)
                        return jqXhr.responseText;
                }
                // If no preference, return whatever is there, preferring structured types over plain text.
                if (jqXhr.responseXML)
                    return jqXhr.responseXML;
                if (jqXhr.responseJSON)
                    return jqXhr.responseJSON;
                if (jqXhr.responseText)
                    return jqXhr.responseText;
                return null;
            }
            if (params.responseType) {
                if (params.responseType !== 'text' && params.responseType !== 'text' && params.responseType !== 'text') {
                    throw new Error('Unsupported response type "' + params.responseType + '".');
                }
            }
            $(form).ajaxForm({
                beforeSerialize: beforeSubmitInternal,
                dataType: params.responseType,
                error: onErrorInternal,
                success: onSuccessInternal
            });
        }
        lab.ajaxForm = ajaxForm;
        ;
        function escape(str) {
            // TODO: Optimize.
            return str.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }
        lab.escape = escape;
        /**
         * Works similar to its PHP counterpart, used to quickly read deeply nested values in an object/array tree without
         * painstaking manual checks if the key exists at every level.
         */
        var DataBox = (function () {
            function DataBox(object) {
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
            DataBox.prototype.get = function (key, defaultValue) {
                if (typeof defaultValue === 'undefined')
                    defaultValue = undefined; // Maybe not needed, but just in case.
                var keySegs = key.split('.');
                var value = this.value;
                if (typeof value !== 'object')
                    return defaultValue;
                for (var i = 0, m = keySegs.length; i < m; i++) {
                    if (value === null || typeof value !== 'object')
                        return defaultValue;
                    if (typeof value[keySegs[i]] === 'undefined')
                        return defaultValue;
                    value = value[keySegs[i]];
                }
                return value;
            };
            DataBox.prototype.unbox = function () {
                return this.value;
            };
            return DataBox;
        })();
        lab.DataBox = DataBox;
        // This shouldn't really be called *array* utils in JS, it should be object utils or dict utils.
        var ArrayUtils = (function () {
            function ArrayUtils() {
            }
            /**
             * Merges a tree of objects/arrays/scalars recursively, properties of the second replacing (or setting)
             * properties of the first.
             */
            ArrayUtils.prototype.mergeRecursive = function (mergeTo, mergeFrom) {
                var merge = function (a, b) {
                    for (var k in b)
                        if (b.hasOwnProperty(k)) {
                            var bv = b[k];
                            if (typeof a.k !== 'undefined') {
                                var av = a[k];
                                if (typeof av === 'object' && typeof bv === 'object') {
                                    merge(av, bv);
                                }
                                else {
                                    av = bv;
                                }
                            }
                            else {
                                a[k] = bv;
                            }
                        }
                };
                merge(mergeTo, mergeFrom);
            };
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
            ArrayUtils.prototype.splitKeys = function (object) {
                var bracketToDot = ArrayUtils.bracketToDot;
                var output = {};
                for (key in object)
                    if (object.hasOwnProperty(key)) {
                        var value = object[key];
                        if (key.indexOf('[') > -1)
                            key = bracketToDot(key);
                        var key = key.split('.');
                        var node = output;
                        for (var i = 0, m = key.length; i < m; i++) {
                            if (i < m - 1) {
                                if (typeof node[key[i]] !== 'object')
                                    node[key[i]] = {};
                                node = node[key[i]];
                            }
                            else {
                                node[key[i]] = value;
                            }
                        }
                        ;
                    }
                return output;
            };
            /**
             * Takes a bracket delimited path such as:
             *
             * "foo[bar][baz]"
             *
             * and returns a dot delimited path such as:
             *
             * "foo.bar.baz"
             */
            ArrayUtils.bracketToDot = function (path) {
                return path.replace(/[\[\]]+/g, '.').replace(/^\.+|\.+$/g, '');
            };
            return ArrayUtils;
        })();
        lab.ArrayUtils = ArrayUtils;
    })(lab = solver.lab || (solver.lab = {}));
})(solver || (solver = {}));
/// <reference path="solver.lab/ObjectUtils.ts" />
/// <reference path="solver.lab.ts" /> 
/// <reference path="declarations/jquery.d.ts" />
/// <reference path="lib.ts" /> 
