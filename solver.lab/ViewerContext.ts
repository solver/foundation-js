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
	 * DEPRECATED DEPRECATED DEPRECATED: This obviously can't be a concrete interface, but should be a set of principles
	 * covered in an article.
	 *
	 * When you create a viewer, the constructor will typically accept an object with event handlers (we don't use the
	 * event observer pattern) to handle any changes (including user actions) that occur in the viewer, as well as any
	 * other API calls that the modeler could to implement for the viewer to use. If the modeler needs to perform
	 * callbacks, the context object should provide a setCallbacks() method that a viewer can invoke with the callbacks
	 * in its constructor (or whenever).
	 * 
	 * Contexts are simple objects that implement one or more methods based on the specific ViewerContext interface
	 * provided to go with a given Viewer class. A context interface typically doesn't have or need to have any public
	 * data (i.e. non-method) properties.
	 * 
	 * Because the events triggered by a viewer are specific to it, this interface has none, and it literally exists to
	 * host this documentation, explaining the pattern you should adhere to.
	 * 
	 * When creating a context interface for your viewer class, add "implements ViewerContext" to signify your
	 * compliance with the pattern principles listed here.
	 * 
	 * - You should try to have as many as possible (if not all) of your context methods declared optional, so the
	 * caller can implement only what they need from your interface, versus be burdened with defining a lot of empty
	 * methods for events (for ex.) they don't need to handle. Any time the viewer could have a default behavior and not
	 * use a context method, allow that method to be optional. Otherwise, of course, make it mandatory.
	 * 
	 * - When implementing event handlers in a context, do note that an event handler method already has a name (the
	 * method name), so you don't need to pass a string for the event name, as is with native browser DOM events, for
	 * example.
	 * 
	 * - For event handler methods, you can define the exact signature of every specific event handler method, you don't
	 * need to create a dedicated event object simply to hold your event's data - provided that data by describing it
	 * directly into the handler's argument signature.
	 * 
	 * - You should name any event handler methods with a prefix "will" and "did", signifying whether the handler is
	 * triggered before or after the event has occurred. Handlers that begin with "will" can also optionally be defined
	 * as returning data, which is then used to modify the behavior of a viewer. For example, you can define a handler
	 * method "willToggle(): boolean" for a button, and then not toggle the button if the handler returns false. Note
	 * that we have taken this naming convention from OS X delegates, but we avoid differentiating modifying handlers
	 * from non-modifying handlers by naming them "should" versus "will". We always use the "will" prefix in both cases
	 * and let the return type and your method documentation speak for the rest.
	 * 
	 * - The higher we go in the viewer hierarchy, the less UI-specific and the more business domain-specific the events
	 * should become. This promotes clarity in your code and reduces the need to change your top viewer's event handler
	 * interface as you change the underlying lower-level viewer components exposing the UI to the user.
	 */
	export interface ViewerContext {}	
}