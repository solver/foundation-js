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
	 * See ViewEventHandler for more details.
	 */
	interface View {		
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
		 * If a view class doesn't have logic to detect unnecessary updates and it always updates on an update() call, 
		 * then it can simply always return true to comply with this interface.
		 */
		update(model?: ViewModel): boolean;
	}
}