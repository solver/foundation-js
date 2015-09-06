/// <reference path="declarations/jquery.d.ts" />
declare module solver.toolbox {
    /**
     * Works similar to its PHP counterpart, used to quickly read deeply nested values in an object/array tree without
     * painstaking manual checks if the key exists at every level.
     */
    class DataBox {
        private value;
        constructor(object: any);
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
        get(key: string, defaultValue: any): any;
        getAll(): any;
    }
}
/**
 * Utilities for working with date & time data.
 */
declare module solver.toolbox.DateUtils {
    /**
     * TODO: Replace this with a more comprehensive RFC 3339 or ISO 8601 support.
     *
     * @param dateString
     * Standard SQL format date or datetime string: "YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS".
     *
     * @return Date
     * Date for the input date string. If the input has no time component, output time is set to 12PM.
     */
    function fromSqlString(dateString: string): Date;
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
    function toSqlString(date?: Date, includeTime?: boolean): string;
}
/**
 * DOM-related utilities.
 */
declare module solver.toolbox.DomUtils {
    /**
     * Encodes plain text for safe inclusion in HTML code.
     */
    function encodeText(str: string): string;
    /**
     * Sets up a handler that fires when a form control potentially changes. Checking if the value has really changed is
     * up to the handler.
     *
     * Set debounceMs to 0 to disable debouncing (you better have a change detector in place as you'll be getting a lot
     * of redundant calls without debouncing).
     *
     * Depends on jQuery & the "debounce/throttle" jQuery plugin.
     */
    function onMaybeChanged(elementSet: JQuery, debounceMs: number, handler: (eventObject: JQueryEventObject) => void): void;
}
declare module solver.toolbox {
    /**
     * Common utilities for operating with functions.
     */
    class FuncUtils {
        /**
         * Implements a simpler subset of Function.prototype.bind(), only binding to the object is supported, no
         * argument binding and no type-checking of the arguments.
         *
         * For this common case, this bind() is much faster than the native version.
         */
        static bind(method: Function, object: Object): () => any;
    }
}
declare module solver.toolbox {
    /**
     * Common utilities for operating with primitives and objects.
     */
    class ObjectUtils {
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
        static clone<T>(object: T, params?: {
            metaProperty?: string;
            stopAtId?: boolean;
        }): T;
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
        static equals(objectA: any, objectB: any, params?: {
            metaProperty?: string;
        }): boolean;
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
        static resolveByName(name: string, parent?: any): any;
        /**
         * Merges a tree of objects/arrays/scalars recursively, properties of the second replacing (or setting)
         * properties of the first.
         */
        merge(mergeTo: Array<any>, mergeFrom: Array<any>): void;
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
        static splitKeys(object: any): any;
        /**
         * Takes a bracket delimited path such as:
         *
         * "foo[bar][baz]"
         *
         * and returns a dot delimited path such as:
         *
         * "foo.bar.baz"
         */
        static bracketToDot(path: string): string;
    }
}
declare module solver.toolbox {
    /**
     * A convenience tool for AJAX calls that captures common features and conventions used in projects.
     *
     * Depends on jQuery 1.9+.
     * Depends on the jQuery Form plugin: http://malsup.com/jquery/form/
     */
    class Ajax {
        protected ctx: Ajax.Context;
        /**
         * For producing unique identifiers in DOM.
         */
        protected static serial: number;
        constructor(ctx: Ajax.Context);
        /**
         * Sends an HTTP request to the server.
         */
        send(request: Ajax.Request): void;
        /**
         * TODO: Consider removing this? Or find a way to make it usable with convertForm().
         *
         * Like send(), but automatically points the browser if a non-error response arrives.
         *
         * The URL is changed only after any user supplied handlers are invoked.
         */
        sendThenLoad(request: Ajax.Request, url: any): void;
        /**
         * TODO: Consider removing this? Or find a way to make it usable with convertForm().
         *
         * Like send(), but automatically reloads the current URL after a non-error response arrives.
         *
         * The page is reloaded after any user supplied handlers are invoked.
         */
        sendThenReload(request: Ajax.Request): void;
        /**
         * Sets up a form to be sent over XHR, with JS callbacks for success and failure.
         */
        convertForm(setup: Ajax.FormConfig): void;
        private addFieldsToForm(form, serial, fields);
        private removeFieldsFromForm(form, serial);
        private validateResponseType(responseType);
        /**
         * Same as dataFromXhr() but formats the response as a log error, if not already formatted as a log.
         */
        private logFromXhr(responseType, jqXhr);
        /**
         * jQuery doesn't return parsed content on error responses, so we need to fish it out of the object.
         *
         * This is why responseType in requests is limited to xml, json, text, as we only have logic for those three
         * types.
         */
        private dataFromXhr(responseType, jqXhr);
    }
    module Ajax {
        interface RequestHandlers {
            /**
             * Function to execute immediately before a request is sent. With form submissions, this handler is invoked
             * before the form is serialized, so you have an opportunity to modify the fields, and this will be
             * reflected in the final request.
             *
             * @return boolean|null
             * Return true to continue sending the request (this is default if you return null or nothing).
             *
             * Return false to abort the request before it's sent.
             */
            willSend?: (details?: RequestDetails) => boolean;
        }
        interface ResponseHandlers {
            /**
             * Function to execute on response success, before any call-specific handlers are invoked.
             */
            didSucceed?: (output: any, status?: number, details?: RequestDetails) => void;
            /**
             * Function to execute on response failure, before any call-specific handlers are invoked.
             */
            didFail?: (log: any, status?: number, details?: RequestDetails) => void;
        }
        interface ResponseType {
            /**
             * Preferred response type, one of "text", "json", "xml". Omit or pass null for auto-detection.
             */
            responseType?: any;
        }
        interface Request extends ResponseHandlers, ResponseType {
            /**
             * URL to call on the server.
             */
            url: string;
            /**
             * HTTP call method. If not specified, defaults to POST.
             */
            method?: string;
            /**
             * Object of input fields to send to the server.
             */
            input?: any;
        }
        interface FormConfig extends RequestHandlers, ResponseHandlers, ResponseType {
            /**
             * Form HTML element which will be converted to submit via AJAX.
             *
             * The URL and method of the request will be taken from the form.
             */
            form: HTMLElement;
        }
        /**
         * Configures the ajax object instance.
         *
         * Any event handlers specified here (optional) will be invoked before the user-supplied handlers for a specific
         * call (if any).
         */
        interface Context extends RequestHandlers, ResponseHandlers {
            /**
             * A set of fields, as an object, that will be inserted into every AJAX call sent to the server.
             *
             * Useful for specifying a CSRF token, API auth token etc.
             */
            injectedFields?: any;
        }
        /**
         * Supplied with some events for additional information.
         */
        interface RequestDetails {
            /**
             * One of: "form", "direct".
             */
            source: string;
            /**
             * Defined only for source = "form", else not defined.
             */
            form?: HTMLElement;
            /**
             * Defined only for source = "direct", else not defined.
             */
            direct?: {
                url: string;
                method: string;
                input: any;
            };
        }
    }
}
declare module solver.lab {
    import Ajax = solver.toolbox.Ajax;
    /**
     * Use these methods (bound to "this") to Ajax.Context as global handlers to get standard error display & repeat
     * submit protection for forms.
     *
     * TODO: Move in-code comments to here and explain in a way a human can understand, how this works.
     *
     * Requires jQuery 1.5+.
     */
    class StandardFormHandler {
        protected formsInProgress: Array<HTMLElement>;
        willSend(details: Ajax.RequestDetails): void;
        didSucceed(output: any, status: number, details: Ajax.RequestDetails): void;
        didFail(log: any, status: number, details: Ajax.RequestDetails): void;
        protected hasFormIn(formList: Array<HTMLElement>, form: HTMLElement): boolean;
        protected addFormIn(formList: Array<HTMLElement>, form: HTMLElement): void;
        protected removeFormIn(formList: Array<HTMLElement>, form: HTMLElement): void;
        protected displayLog(form: HTMLElement, log: Array<any>): void;
    }
}
