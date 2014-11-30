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
	 * When you update a view, the update() method will typically pass to it a data object called the view model. The
	 * model describes the state of the view in an abstract, reusable manner that is as removed from the actual view
	 * implementation details as is practical (to encourage model reuse across similar views).
	 * 
	 * In this pattern, view models are composed entirely out of data, and not out of methods, and the data schema is
	 * highly dependent on the specific ViewModel interface and/or class provided to go with a given View class.
	 * 
	 * Because the data supplied to a view can be specific to it, this interface has no predefined properties, and it
	 * literally exists to host this documentation, explaining the pattern you should adhere to.
	 * 
	 * When creating a view model interface for your view class, add "implements ViewModel" to signify your compliance
	 * with the pattern principles listed here.
	 * 
	 * - Your ViewModel should be composed entirely out of data properties that the view can access directly and not
	 * through attached methods in the model. This doesn't mean you must precompute expensive data into your model ahead
	 * of time - you are free to use getter properties that compute said data partially and on-demand as the view
	 * accesses it (or not).
	 * 
	 * - Your ViewModel you should preferably consist of a simple tree of objects, arrays and scalars. Null and
	 * undefined are allowed, but you shouldn't assign a different semantical meaning to null and undefined, they should
	 * be both treated as null by convention. Do not put HTML DOM elements and other complex internal objects in your
	 * view model. These restrictions are in place to both encourage model reuse, and to allow a model's contents to be
	 * possible to clone by ObjectUtils.clone() and comparable via ObjectUtils.equals(), so refer to the documentation
	 * of those methods for details of what is supported.
	 * 
	 * - The higher we go in the view hierarchy, the less UI-specific and the more business domain-specific the model
	 * should become. This promotes clarity in your code and reduces the need to change your top view model's interface
	 * as you change the underlying lower-level view components exposing the UI to the user.
	 * 
	 * - The view model may be directly stored in a view to represent its internal state. Alternatively the model's data
	 * may be used for building the internal state, but may differ from it terms of what is stored, how it's stored, and
	 * may contain additional internal data which isn't a part of the model. In some cases a view may keep no internal
	 * state on its own at all, instead preferring to re-render itself in full on every update() call and "forget" the
	 * data that produced the render (similar to how typical server MVC "template" views work). This is suitable for
	 * views with an immediate mode rendering context.
	 * 
	 * - If the view wants the flexibility to modify its state directly (see item below about "speculative" state
	 * updates), the model parts it wants to modify should be cloned (i.e. so editing them doesn't affect the original
	 * model object). A view should never directly modify a model or a part of a model (as per the MVC pattern), instead
	 * delegating this responsibility to the creator, by triggering event handlers and waiting for incoming update()
	 * calls.
	 * 
	 * - When a view stores its internal state as (a full or a partial) clone of the model (see ObjectUtils.clone() as
	 * one approach), during the next update() call you can compare ("dirty check") the internal state and model to
	 * detect needed state changes (see ObjectUtils.equals() as one approach).
	 * 
	 * - When using ObjectUtils to implement model cloning and comparison, you can speed up both operations by inserting
	 * the special property "__ID__" at strategic places in a model's data (read the documentation of ObjectUtils about
	 * hashProperty to learn more). While you could name your hash property anything, for ViewModel you should stick to
	 * "__ID__" to simplify code comprehension and reduce needed documentation for implementing your view model
	 * interfaces. This also means that even if the code building your model data doesn't implement the "__ID__"
	 * optimization (because you've not declared it in your interface, or you've declared it as optional), it should not
	 * use a property named "__ID__" anywhere inside the data tree, as it still has a special meaning.
	 * 
	 * - By keeping a (modified or straight) copy of the last given model as its internal state, a view can
	 * significantly improve its responsiveness as perceived by the user. In a most basic implementation, when a view is
	 * directly modified (say by a user interacting with it) it should inform its creator by triggering an event
	 * handler, and then wait for the next update() call in order to update itself in (indirect) response to the user
	 * interaction. However, instead of waiting for this update call, a view may "speculatively" guess how the resulting
	 * model change could affect its internal state and modify its internal state itself immediately (again, the
	 * internal state may either be a direct clone of the model, or derived from it). Then, once the expected update()
	 * call arrives, the view can compare its internal state and the given model. If the view guessed correctly and
	 * there's a match, it can avoid a redundant update. This is particularly useful for improving responsiveness when
	 * the event handler or its resultant update are debounced, throttled (i.e. rate-limited) or delayed for technical
	 * reasons (for ex. involve an async remote call or off-thread processing for some of its logic). This way your app
	 * response seems instantaneous, despite the real view update call may come at a later time.
	 * 
	 * - Try to keep your models small. Any properties that won't change during the lifetime of a component should be
	 * passed to the constructor or via other means (configuration files etc.). Because the model has to be passed on
	 * every update() call, possibly cloned and compared, you shouldn't put any information in there that you don't
	 * absolutely need when a view updates itself. Think about it like URL query parameters for page state: the less you
	 * you have of them, the better (best if you have none). Of course, sometimes a model needs to contain a large set
	 * of complicated data, and this is unavoidable. In this case, to enumerate your possible tactics again, you may do
	 * only selective cloning and comparison, use the "__ID__" property, abandon detecting change and render in full, or
	 * you can also require the model is accompanied by explicit change sets to save your view the work of deriving them
	 * (see notes about changesets and hints under View.update()).
	 */
	export interface ViewModel {}
}