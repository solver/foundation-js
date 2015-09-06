var solver;
(function (solver) {
    var toolbox;
    (function (toolbox) {
        "use strict";
        var encodeText = solver.toolbox.DomUtils.encodeText;
        /**
         * A convenience tool for AJAX calls that captures common features and conventions used in projects.
         *
         * Depends on jQuery 1.9+.
         * Depends on the jQuery Form plugin: http://malsup.com/jquery/form/
         */
        var Ajax = (function () {
            function Ajax(ctx) {
                this.ctx = ctx;
            }
            /**
             * Sends an HTTP request to the server.
             */
            Ajax.prototype.send = function (request) {
                var _this = this;
                var ctx = this.ctx;
                if (request.method == null)
                    request.method = 'POST';
                if (request.input == null)
                    request.input = {};
                if (request.responseType)
                    this.validateResponseType(request.responseType);
                if (ctx.injectedFields !== null) {
                    var fields = ctx.injectedFields;
                    for (var i in fields)
                        if (fields.hasOwnProperty(i)) {
                            request.input[i] = fields[i];
                        }
                }
                var details = {
                    source: "direct",
                    direct: {
                        url: request.url,
                        method: request.method,
                        input: request.input,
                    }
                };
                if (ctx.willSend) {
                    if (ctx.willSend(details) === false)
                        return;
                }
                $.ajax(request.url, {
                    method: request.method,
                    data: request.input,
                    dataType: request.responseType != null ? request.responseType : null,
                    success: function (response) {
                        // FIXME: Is the status code here always 200, really?
                        if (ctx.didSucceed)
                            ctx.didSucceed(response, 200, details);
                        if (request.didSucceed)
                            request.didSucceed(response, 200, details);
                    },
                    error: function (jqXhr) {
                        var response = _this.logFromXhr(null, jqXhr);
                        if (ctx.didFail)
                            ctx.didFail(response, jqXhr.status, details);
                        if (request.didFail)
                            request.didFail(response, jqXhr.status, details);
                    }
                });
            };
            /**
             * TODO: Consider removing this? Or find a way to make it usable with convertForm().
             *
             * Like send(), but automatically points the browser if a non-error response arrives.
             *
             * The URL is changed only after any user supplied handlers are invoked.
             */
            Ajax.prototype.sendThenLoad = function (request, url) {
                var oldDidSucceed = request.didSucceed;
                request.didSucceed = function (output) {
                    if (oldDidSucceed)
                        oldDidSucceed(output);
                    location.assign(url);
                };
                this.send(request);
            };
            /**
             * TODO: Consider removing this? Or find a way to make it usable with convertForm().
             *
             * Like send(), but automatically reloads the current URL after a non-error response arrives.
             *
             * The page is reloaded after any user supplied handlers are invoked.
             */
            Ajax.prototype.sendThenReload = function (request) {
                var oldDidSucceed = request.didSucceed;
                request.didSucceed = function (output) {
                    if (oldDidSucceed)
                        oldDidSucceed(output);
                    location.reload(true);
                };
                this.send(request);
            };
            /**
             * Sets up a form to be sent over XHR, with JS callbacks for success and failure.
             */
            Ajax.prototype.convertForm = function (setup) {
                var _this = this;
                var ctx = this.ctx;
                var serial = Ajax.serial++;
                if (setup.responseType != null)
                    this.validateResponseType(setup.responseType);
                var details = {
                    source: "form",
                    form: setup.form
                };
                $(setup.form).ajaxForm({
                    dataType: setup.responseType != null ? setup.responseType : null,
                    beforeSerialize: function () {
                        _this.addFieldsToForm(setup.form, serial, ctx.injectedFields);
                        if (ctx.willSend) {
                            if (ctx.willSend(details) === false) {
                                _this.removeFieldsFromForm(setup.form, serial);
                                return false;
                            }
                        }
                        if (setup.willSend) {
                            if (setup.willSend(details) === false) {
                                _this.removeFieldsFromForm(setup.form, serial);
                                return false;
                            }
                        }
                    },
                    success: function (response) {
                        _this.removeFieldsFromForm(setup.form, serial);
                        // FIXME: Is the status code here always 200, really?
                        if (ctx.didSucceed)
                            ctx.didSucceed(response, 200, details);
                        if (setup.didSucceed)
                            setup.didSucceed(response, 200, details);
                    },
                    error: function (jqXhr) {
                        _this.removeFieldsFromForm(setup.form, serial);
                        var response = _this.logFromXhr(null, jqXhr);
                        if (ctx.didFail)
                            ctx.didFail(response, jqXhr.status, details);
                        if (setup.didFail)
                            setup.didFail(response, jqXhr.status, details);
                    }
                });
            };
            Ajax.prototype.addFieldsToForm = function (form, serial, fields) {
                if (fields == null)
                    return;
                for (var i in fields)
                    if (fields.hasOwnProperty(i)) {
                        var field = $('<input type="hidden" name="' + encodeText(i) + '">');
                        field.addClass('-Solver-Toolbox-Ajax-InjectedField' + serial);
                        field.val(fields[i]);
                        $(form).append(field);
                    }
            };
            Ajax.prototype.removeFieldsFromForm = function (form, serial) {
                $('.-Solver-Toolbox-Ajax-InjectedField' + serial, form).remove();
            };
            Ajax.prototype.validateResponseType = function (responseType) {
                if (responseType == null)
                    return;
                if (responseType === 'xml')
                    return;
                if (responseType === 'json')
                    return;
                if (responseType === 'text')
                    return;
                throw new Error('Invalid responseType "' + responseType + '".');
            };
            /**
             * Same as dataFromXhr() but formats the response as a log error, if not already formatted as a log.
             */
            Ajax.prototype.logFromXhr = function (responseType, jqXhr) {
                var response = this.dataFromXhr(responseType, jqXhr);
                // If we haven't received a formatted log from the server, we format the response text as one.
                var log = response instanceof Array ? response : [{
                    path: null,
                    type: 'error',
                    message: response,
                    code: jqXhr.status,
                    details: null
                }];
                return log;
            };
            /**
             * jQuery doesn't return parsed content on error responses, so we need to fish it out of the object.
             *
             * This is why responseType in requests is limited to xml, json, text, as we only have logic for those three
             * types.
             */
            Ajax.prototype.dataFromXhr = function (responseType, jqXhr) {
                if (typeof responseType === 'string') {
                    if (responseType === 'xml' && jqXhr.responseXML)
                        return jqXhr.responseXML;
                    if (responseType === 'json' && jqXhr.responseJSON)
                        return jqXhr.responseJSON;
                    if (responseType === 'text' && jqXhr.responseText)
                        return jqXhr.responseText;
                }
                // If no (matching) preference, return whatever is there, preferring structured types over plain text.
                if (jqXhr.responseXML)
                    return jqXhr.responseXML;
                if (jqXhr.responseJSON)
                    return jqXhr.responseJSON;
                if (jqXhr.responseText)
                    return jqXhr.responseText;
                return null;
            };
            /**
             * For producing unique identifiers in DOM.
             */
            Ajax.serial = 0;
            return Ajax;
        })();
        toolbox.Ajax = Ajax;
    })(toolbox = solver.toolbox || (solver.toolbox = {}));
})(solver || (solver = {}));
/*
 * Copyright (C) 2011-2015 Solver Ltd. All rights reserved.
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
var solver;
(function (solver) {
    var toolbox;
    (function (toolbox) {
        "use strict";
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
            DataBox.prototype.getAll = function () {
                return this.value;
            };
            return DataBox;
        })();
        toolbox.DataBox = DataBox;
    })(toolbox = solver.toolbox || (solver.toolbox = {}));
})(solver || (solver = {}));
/**
 * Utilities for working with date & time data.
 */
var solver;
(function (solver) {
    var toolbox;
    (function (toolbox) {
        var DateUtils;
        (function (DateUtils) {
            /**
             * TODO: Replace this with a more comprehensive RFC 3339 or ISO 8601 support.
             *
             * @param dateString
             * Standard SQL format date or datetime string: "YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS".
             *
             * @return Date
             * Date for the input date string. If the input has no time component, output time is set to 12PM.
             */
            function fromSqlString(dateString) {
                var segs = dateString.split(/[- :]/);
                if (segs.length >= 6) {
                    return new Date(+segs[0], (+segs[1]) - 1, +segs[2], +segs[3], +segs[4], +segs[5]);
                }
                else {
                    return new Date(+segs[0], (+segs[1]) - 1, +segs[2], 12, 0, 0);
                }
            }
            DateUtils.fromSqlString = fromSqlString;
            /**
             * TODO: Replace this with a more comprehensive RFC 3339 or ISO 8601 support.
             *
             * @param date
             * If you skip this parameter or pass null, the current date & time are taken.
             *
             * @param includeTime
             * Whether to render just a date, or include the time part of the string in the output.
             *
             * @return
             * Standard SQL format date or datetime string: "YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS".
             */
            function toSqlString(date, includeTime) {
                if (date === void 0) { date = null; }
                if (includeTime === void 0) { includeTime = false; }
                var pad = function (str, length) {
                    str += '';
                    while (str.length < length) {
                        str = '0' + str;
                    }
                    return str;
                };
                if (date == null)
                    date = new Date();
                var dateString = date.getFullYear() + '-' + pad(date.getMonth() + 1, 2) + '-' + pad(date.getDate(), 2);
                if (includeTime) {
                    dateString += ' ' + pad(date.getHours(), 2) + ':' + pad(date.getMinutes() + 1, 2) + ':' + pad(date.getSeconds(), 2);
                }
                return dateString;
            }
            DateUtils.toSqlString = toSqlString;
        })(DateUtils = toolbox.DateUtils || (toolbox.DateUtils = {}));
    })(toolbox = solver.toolbox || (solver.toolbox = {}));
})(solver || (solver = {}));
/**
 * DOM-related utilities.
 */
var solver;
(function (solver) {
    var toolbox;
    (function (toolbox) {
        var DomUtils;
        (function (DomUtils) {
            "use strict";
            /**
             * Encodes plain text for safe inclusion in HTML code.
             */
            function encodeText(str) {
                // TODO: Optimize.
                return str.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            }
            DomUtils.encodeText = encodeText;
            /**
             * Sets up a handler that fires when a form control potentially changes. Checking if the value has really changed is
             * up to the handler.
             *
             * Set debounceMs to 0 to disable debouncing (you better have a change detector in place as you'll be getting a lot
             * of redundant calls without debouncing).
             *
             * Depends on jQuery & the "debounce/throttle" jQuery plugin.
             */
            function onMaybeChanged(elementSet, debounceMs, handler) {
                var anyImmediateChange = 'cut copy paste mousedown mouseup click keydown keyup keypress change propertychange textInput textinput input focus blur';
                if (debounceMs > 0) {
                    elementSet.on(anyImmediateChange, $.debounce(debounceMs, handler));
                }
                else {
                    elementSet.on(anyImmediateChange, handler);
                }
            }
            DomUtils.onMaybeChanged = onMaybeChanged;
        })(DomUtils = toolbox.DomUtils || (toolbox.DomUtils = {}));
    })(toolbox = solver.toolbox || (solver.toolbox = {}));
})(solver || (solver = {}));
/*
 * Copyright (C) 2011-2015 Solver Ltd. All rights reserved.
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
var solver;
(function (solver) {
    var toolbox;
    (function (toolbox) {
        "use strict";
        /**
         * Common utilities for operating with functions.
         */
        var FuncUtils = (function () {
            function FuncUtils() {
            }
            /**
             * Implements a simpler subset of Function.prototype.bind(), only binding to the object is supported, no
             * argument binding and no type-checking of the arguments.
             *
             * For this common case, this bind() is much faster than the native version.
             */
            FuncUtils.bind = function (method, object) {
                return function () {
                    method.apply(object, arguments);
                };
            };
            return FuncUtils;
        })();
        toolbox.FuncUtils = FuncUtils;
    })(toolbox = solver.toolbox || (solver.toolbox = {}));
})(solver || (solver = {}));
/*
 * Copyright (C) 2011-2015 Solver Ltd. All rights reserved.
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
var solver;
(function (solver) {
    var toolbox;
    (function (toolbox) {
        "use strict";
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
            /**
             * Takes a string name and return the object for it (say a class) resolved against the global object (window),
             * or the specified parent.
             *
             * Returns null if the name points to no existing object.
             *
             * @param name
             * A dot delimiter string representing an absolute path to an object (from the global object, or the specified
             * parent).
             *
             * @param parent
             * The parent object to resolve the name against. If not specified, it uses the global object (window).
             *
             * @return {any|null}
             * The value for this name, or null if it doesn't exist.
             */
            ObjectUtils.resolveByName = function (name, parent) {
                if (parent === void 0) { parent = null; }
                var segs = name.split('.');
                var object = parent == null ? window : parent;
                for (var i = 0, maxI = segs.length; i < maxI; i++) {
                    if (typeof object[segs[i]] === 'undefined')
                        return null;
                    object = object[segs[i]];
                }
                return object;
            };
            /**
             * Merges a tree of objects/arrays/scalars recursively, properties of the second replacing (or setting)
             * properties of the first.
             */
            ObjectUtils.prototype.merge = function (mergeTo, mergeFrom) {
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
            ObjectUtils.splitKeys = function (object) {
                var bracketToDot = ObjectUtils.bracketToDot;
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
            ObjectUtils.bracketToDot = function (path) {
                return path.replace(/[\[\]]+/g, '.').replace(/^\.+|\.+$/g, '');
            };
            return ObjectUtils;
        })();
        toolbox.ObjectUtils = ObjectUtils;
    })(toolbox = solver.toolbox || (solver.toolbox = {}));
})(solver || (solver = {}));
/// <reference path="toolbox/Ajax.ts" />
/// <reference path="toolbox/DataBox.ts" />
/// <reference path="toolbox/DateUtils.ts" />
/// <reference path="toolbox/DomUtils.ts" />
/// <reference path="toolbox/FuncUtils.ts" />
/// <reference path="toolbox/ObjectUtils.ts" /> 
/// <reference path="declarations/jquery.d.ts" />
/// <reference path="lib.ts" /> 
