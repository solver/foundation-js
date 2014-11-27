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

/**
 * A library assisting common tasks performed by views.
 */
module solver.lab.view {
	/**
	 * EXPERIMENTAL: This class may go away, or change, but fortunately it's easily replaced.
	 *
	 * TODO: Explain why this class exists in here.
	 */ 
	export class ModelComparator {
		private modelClone: ViewModel = null;
		
		public hasChanged(model: ViewModel) {
			var equals = solver.lab.ObjectUtils.equals(this.modelClone, model, {hashProperty: '__ID__'});
			this.modelClone = solver.lab.ObjectUtils.clone(model, {hashProperty: '__ID__'});
		}
	}
}