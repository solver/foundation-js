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
	 * When you create a view, the constructor will typically accept an event handler object (we don't use the event
	 * observer pattern) to handle any changes (including user actions) that occur in the view.
	 * 
	 * Event handlers are simple objects that implement one or more methods based on the specific ViewEventHandler
	 * interface provided to go with a given View class. An event handler interface typically doesn't have or need to 
	 * have any public data (i.e. non-method) properties.
	 * 
	 * Because the events triggered by a view are specific to it, this interface has none, and it literally exists to
	 * host this comment explaining the pattern you should adhere to.
	 * 
	 * When creating an event handler interface for your view class, add "implements ViewEventHandler" to signify your
	 * compliance with the pattern principles listed here.
	 * 
	 * - You should try to have as many as possible (if not all) of your event handler methods declared optional, so the
	 * caller can implement only what they need from your interface, versus be burdened with defining a lot of empty
	 * methods for events they don't need to handle.
	 * 
	 * - An event handler already has a name (the method name), so you don't need to pass a string for the event name,
	 * as is with native browser DOM events, for example.
	 * 
	 * - You can define the exact signature of every specific event handler method, you don't need to create a dedicated
	 * event object simply to hold your event's data - provide that data by describing it directly into the handler's
	 * argument signature.
	 * 
	 * - You should name your handler methods with a prefix "will" and "did", signifying whether the handler is
	 * triggered before or after the event has occurred. Handlers that begin with "will" can also optionally be defined
	 * as returning data, which is then used to modify the behavior of a view. For example, you can define a handler
	 * method "willToggle(): boolean" for a button, and then not toggle the button if the handler returns false. Note
	 * that we have taken this naming convention from OS X delegates, but we avoid differentiating modifying handlers
	 * from non-modifying handlers by naming them "should" versus "will". We always use the "will" prefix in both cases
	 * and let the return type and your method documentation speak for the rest.
	 * 
	 * - The higher we go in the view hierarchy, the less UI-specific and the more business domain-specific the events
	 * should become. This promotes clarity in your code and reduces the need to change your top view's event handler
	 * interface as you change the underlying lower-level view components exposing the UI to the user.
	 */
	interface ViewEventHandler {
	}	
}