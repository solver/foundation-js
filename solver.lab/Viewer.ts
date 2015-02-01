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
	 * The interface describes a light pattern for creating model-view application (GUIs and other).
	 * 
	 * The pattern differentiates two types of controllers: one that controls a model (classical controller in MVC) here
	 * called a "modeler" and one that controls a view (a read only project of the model, produced by the modeler) here
	 * caller a "viewer".
	 * 
	 * By differentiating behavior from data, it's possible to define the "model" and the "view" purely as data objects,
	 * used by their respective controller types, and we can talk about "modeler" and "viewer" as the behavior wrapped
	 * around the "model" and "view", respectively, that describes the interactive logic that shapes and represents that
	 * data.
	 * 
	 * In classic MVC, the views are the actual components that receive the model and display it. They're not to modify
	 * it, but if they receive the model directly, there's no clear way to enforce this. By instead defining the
	 * interaction between modeler and viewer as the modeler producing a read-only projection of the model as "view"
	 * which is sent to the viewer, we achieve several objectives:
	 * 
	 * - We recognize not all views needs to be displayed by an interactive component, and may be usable simply as data.
	 * In this case the modeler produces views from its model and sends it to its recipients, and there may simply be no
	 * viewers (or there may be no viewers for all the views produced, at least).
	 * 
	 * - We give a name to the "read only model" concept described in MVC, but not fully fleshed out. The model is fully
	 * owned and encapsulated within the modeler. It's never shared out. While a view may be a verbatim copy or even
	 * reference to the model (which is treated as read-only only by convention/contract), it can also be any kind of
	 * transformation of the model with a different data schema that is suitable for a given viewer.
	 * 
	 * - By being explicit that the "viewer", when interactive, is also a type of controller, we can see "viewer" and
	 * "modeler" as simply roles a controller can be in, they are relative, not absolute. Meaning that a controller may
	 * both be a modeler (owns a model) and a viewer (receives views from a "supermodel"). This describes clearly how
	 * the hierarchy formes in this pattern: it's about controllers being both modelers and viewers and interacting with
	 * each other as such. A modeler may be building its own model partially based on the views received from another
	 * modeler's model.
	 * 
	 * A viewer is typically instantiated by its modeler, but it may also be instantiated by another entity and injected
	 * into a modeler to manage.
	 * 
	 * We have no way to define this in the interface, but the Viewer constructor will typically accept an object
	 * implementing this viewer's "context". This is a mediating object, whose interface is typically defined by the
	 * viewer, and implemented by the modeler, which can contain any methods for indirectly communicating with the
	 * modeler, for example when a viewer wants to notify the modeler of a viewer event (user actions, internal state
	 * changes), it does this by invoking a method on the context object. The "context" is like an API scoped to that
	 * viewer. By not interacting with the modeler directly, this frees the modeler to define its own methods freely and
	 * manage many views without risking method name collisions and other concerns like this.
	 * 
	 * The context pattern is very similar to the delegate objects as used in OS X Cocoa, with the difference that
	 * they're seen more as proxy of the modeler that's given to the viewer, and not as purely informing the viewer how
	 * to handle and implement its own functionality (the way a delegate does).
	 * 
	 * Likewise a modeler should avoid invoking method directly on the view, other than the constructor and update(). If
	 * the modeler wants to call the viewer, it should provide a method setCallbacks() on the context, which allows the
	 * viewer to provice an object with all needed callbacks the modeler expects to call in communicating with the
	 * viewer.
	 * 
	 * Also, by convention, viewers which render themselves in the HTML DOM should request their root HTMLElement in the
	 * constructor, and avoid selecting their root directly via CSS selectors or other direct mechanisms that could lead
	 * to tighter coupling with the particular setup of the page document.
	 * 
	 * See ViewerContext for more details.
	 */
	export interface Viewer {		
		/**
		 * The update() method triggers the viewer to update itself, according to the passed view data.
		 * 
		 * A viewer shouldn't be expected to render itself fully simply because it was instantiated (optionally it might
		 * - this is a decision left to the viewer implementers), instead the instantiator has to call update() at least
		 * once after instantiating the viewer for that (this is especially the case when the viewer needs the view
		 * supplied via the update method in order to fully render itself).
		 * 
		 * The fact a method update() exists doesn't mean that a viewer should sit absolutely still until said method is
		 * called. Depending on what your viewer does, it's normal for it to animate and be fully interactive in-between
		 * two update() calls.
		 * 
		 * It's acceptable also that some viewers may choose to extend the signature of this method by adding more
		 * arguments after the model. However, to comply with this interface, you should make these parameters optional.
		 * 
		 * One viable extension would be to pass a view changeset as a second argument, so the viewer won't have to
		 * compare and clone views to derive the changeset itself. For now we don't have a standard approach to
		 * recommend for this, aside from: choose the best approach on a viewer-per-viewer basis. You can provide
		 * context specific hints to ease the work of the viewer for common scenarios. You can use a set of properties
		 * that act as "dirty bits" for specific parts of the view, or you can provide an exhaustive delta of modified
		 * properties.
		 * 
		 * For example, in a list of records, the second argument could be a parameter like lastRecordChange?: boolean,
		 * to save the viewer the work of cloning and comparing the entire list on every update, if 90% of the time the
		 * change is only the last record (and when the flag is false or not passed, the viewer can re-render in full).
		 * 
		 * TODO: Monitor Object.observe & Angular's Watchtower.js polyfill (https://github.com/angular/watchtower.js).
		 * Might be a good basis for a recommended standard changeset format.
		 * 
		 * TODO: Explore mori (ClojureScript) and Facebook's Immutable.JS (used in React.JS) as an alternative to
		 * diffing mutable structures; immutables can be cloned and compared efficiently and can be suitable in some
		 * cases (in basic cases it's more trouble than it's worth as typical JS apps regularly rebuild parts or all of
		 * their model from server JSON).
		 * 
		 * TODO: Explore protocols for partial view updates (i.e. where the size of the view or the bandwidth/latency
		 * between modeler/viewer preclude passing the full view every time, so parts of the view are passed instead,
		 * deltas, and they're either merged into a full view locally at the viewer, or the viewer is aware of having a
		 * partial view to work with; compare with CPU memory cache architectures, which have the same constraints, from
		 * I/O to RAM, to L3/L2/L1 and registers).
		 * 
		 * @param view
		 * View data sent from the modeler that should help define the view's internal state (its own internal implicit
		 * or explicit "model"). Some viewers may not accept view-based state supplied by the caller (rare), so this
		 * parameter is made optional. Furthermore, some viewers may have a meaningful response to an update() method
		 * that passes a view sometimes, sometimes it doesn't. This logic depends on the viewer.
		 * 
		 * The viewer may use some simple tools and conventions to determine if the passed view has changed since the
		 * previous update() call. See View for details.
		 * 
		 * IMPORTANT: The viewer should treat the view passed to it as an immutable read-only structure and not modify
		 * it. If the viewer requires a modified version of the view, it can obtain a copy of it via
		 * ObjectUtils.clone().
		 * 
		 * @return A viewer may (or may not) use the return channel to return views of its internal model (in effect
		 * acting as a modeler itself).
		 * 
		 * The return channel is not required because a view may be rendering itself to any other context (like an HTML
		 * DOM element, or a canvas image, a socket, etc.). However the return channel is useful when the modeler uses a
		 * viewer simply to transform one view (the one fed into the viewer) to another, with optional state
		 * (combinatorial vs. sequential logic) in the viewer.
		 */
		update(view?: View): boolean;
	}
}