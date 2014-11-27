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
	 * When you update a view, the update() method will typically pass to it a structure-like data object called the
	 * view model. The model describes the state of the view in an abstract, reusable manner that is as removed from the
	 * actual view implementation details as is practical (to encourage model reuse across similar views).
	 * 
	 * In this pattern, view models are composed entirely out of data, and not out of methods, and the data schema is
	 * highly dependent on the specific ViewModel interface provided to go with a given View class.
	 * 
	 * Because the data supplied to a view can be specific to it, this interface has no predefined properties, and it
	 * literally exists to host this comment explaining the pattern you should adhere to.
	 * 
	 * When creating a view model interface for your view class, add "implements ViewModel" to signify your compliance
	 * with the pattern principles listed here.
	 * 
	 * - Your ViewModel should be composed entirely out of data properties that the view can access directly and not
	 * through attached methods in the model. This doesn't mean you must precompute expensive data into your model ahead
	 * of time - you are free to use getter properties that compute said data partially and on-demand as the view
	 * accesses it (or not).
	 * 
	 * - For your ViewModel you should prefer a simple tree of objects, arrays and scalars. Null and undefined are
	 * allowed, but you shouldn't assign a different semantical meaning to null and undefined, they should be both
	 * treated as null by convention. Do not put HTML DOM elements and other complex internal objects in your view
	 * model. These restrictions are in place to both encourage model reuse, and to allow a model's contents to be
	 * cloneable by ObjectUtils.clone() and comparable via ObjectUtils.equals(), so refer to the documentation of those
	 * methods for details of what is supported.
	 * 
	 * - The higher we go in the view hierarchy, the less UI-specific and the more business domain-specific the model
	 * should become. This promotes clarity in your code and reduces the need to change your top view model's interface
	 * as you change the underlying lower-level view components exposing the UI to the user.
	 * 
	 * - A view may be implemented to clone and keep a copy of the model (via ObjectUtils.clone()) in itself until the
	 * next update() call. Then on said next update() call it can compare its copy of the model with the new model (via
	 * ObjectUtils.equals()), and update itself only depending on what has changed. To speed up both cloning and
	 * comparison, your model may, at strategic places, provide the standard (for this pattern) "__ID__" hash property
	 * that can be supplied to both ObjectUtils.clone(..., {hashProperty: "__ID__"}) and ObjectUtils.equals(...,
	 * {hashProperty: "__ID__"}) as an optimization tactic (read the documentation of these two to learn more). While
	 * said methods accept any name for hash properties, for ViewModel you should stick to "__ID__" to simplify code
	 * comprehension and reduce needed documentation for implementing your view model interfaces. This also means that
	 * even if the code building your model data doesn't implement the "__ID__" optimization (because you've not
	 * declared it your interface, or you've declared it as optional), it should not use a property named "__ID__"
	 * anywhere inside the data tree, as it still has a special meaning.
	 * 
	 * - Try to keep your model small. Any properties that won't change during the lifetime of a component should be
	 * passed to the constructor or via other means (configuration files etc.) Because the model has to be passed on
	 * every update() call, cloned and compared, you shouldn't put any information in there that you don't absolutely
	 * need when a view updates itself. Think about it like URL query parameters for a page state: the less you have of
	 * them, the better (and best if you have none). Of course, sometimes a model needs to contain a large list of
	 * complicated data, and this is unavoidable. Then you should use the "__ID__" property to speed up cloning and
	 * comparisons (see the previous item on this list), or alternatively your view should use another method of
	 * avoiding unnecessary updates and not use the clone()/equals() approach.
	 */
	export interface ViewModel {}
}