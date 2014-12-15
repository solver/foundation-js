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
	 * The interface describes a light pattern for creating hierarchical interactive views for application GUIs.
	 * 
	 * A view is typically instantiated either by a controller, or a parent view (which also implements this interface).
	 * 
	 * We have no way to define this in the interface, but the View constructor will typically accept an object
	 * implementing ViewEventHandler, in case the view wants to notify the instantiating code of any events (user
	 * actions, internal state changes etc.) that occur with it.
	 *
	 * Also, by convention, HTML DOM views should request their root HTMLElement in the constructor, and avoid selecting
	 * their root directly via CSS selectors or other direct mechanisms that could lead to tighter coupling with the
	 * particular setup of the page document.
	 * 
	 * See ViewEventHandler for more details.
	 */
	export interface View {		
		/**
		 * The update() method triggers the view to update itself, according to the passed model data.
		 * 
		 * A view shouldn't be expected to render itself fully simply because it was instantiated (optionally it might -
		 * this is a decision left to the view implementers), instead the instantiator has to call update() at least
		 * once after instantiating the view for that (this is especially the case when the view needs the model 
		 * supplied via the update method in order to fully render itself).
		 *
		 * The fact a method update() exists doesn't mean that a view should sit absolutely still until said method is 
		 * called. Depending on what your view does, it's normal for it to animate and be fully interactive in-between
		 * two update() calls.
		 *
		 * It's acceptable also that some views may choose to extend the signature of this method by adding more
		 * arguments after the model. However, to comply with this interface, you should make these parameters optional.
		 *
		 * One viable extension would be to pass a model changeset as a second argument, so the view won't have to 
		 * compare and clone models to derive the changeset itself. For now we don't have a standard approach to
		 * recommend for this, aside from: choose the best approach on a view-per-view basis. You can provide context
		 * specific hints to ease the work of the view for common scenarios. You can use a set of properties that act
		 * as "dirty bits" for specific parts of the model, or you can provide an exhaustive delta of modified 
		 * properties.
		 *
		 * For example, in a list of records, the second argument could be a parameter like lastRecordChange?: boolean,
		 * to save the view the work of cloning and comparing the entire list on every update, if 90% of the time the
		 * change is only the last record (and when the flag is false or not passed, the view can re-render in full).
		 *
		 * TODO: Monitor Object.observe & Angular's Watchtower.js polyfill (https://github.com/angular/watchtower.js).
		 * Might be a good basis for a recommended standard changeset format.
		 *
		 * @param model
		 * Model data that should define the view's state. Some views may not have model-based state supplied by the
		 * caller, so this parameter is made optional. Furthermore, some views may have a meaningful response to an 
		 * update() method that passes a model sometimes, sometimes it doesn't. This logic depends on the view.
		 * 
		 * The view may use some simple tools and conventions to determine if the passed model has changed since the
		 * previous update() call. See ViewModel for details.
		 *
		 * IMPORTANT: The view should treat the model passed to it as an immutable read-only structure and not modify 
		 * it. If the view requires a modified version of the model, it can obtain a copy of it via ObjectUtils.clone().
		 *
		 * @return
		 * True if the view deemed it necessary to update itself in this update() call, based on the passed model
		 * changes (or other reasons), and false if the view determined it doesn't have to update itself.
		 *
		 * This return result is primarily useful when you extend a View class and you want to know if the superclass
		 * detected a change requiring an update when you call super.update().
		 *
		 * It's also useful when performance testing and debugging your application - you can easily get a bird's-eye
		 * view of which views really update when you call update() on them in your application controller.
		 *
		 * If a view class doesn't have logic to detect unnecessary updates and it always updates on an update() call, 
		 * then it can simply always return true to comply with this interface. It can also always return false, if
		 * it doesn't update its rendering after it's constructed (i.e. it's a "static view").
		 */
		update(model?: ViewModel): boolean;
	}
}