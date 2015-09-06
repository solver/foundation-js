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

module solver.toolbox {
	"use strict";
	
	/**
	 * Common utilities for operating with functions.
	 */
	export class FuncUtils {
		/**
		 * Implements a simpler subset of Function.prototype.bind(), only binding to the object is supported, no
		 * argument binding and no type-checking of the arguments.
		 * 
		 * For this common case, this bind() is much faster than the native version.
		 */
		public static bind(method: Function, object: Object): Function {
			return function () {
				method.apply(object, arguments);
			};
		}
	}
}