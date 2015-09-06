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

/// <reference path="../lib.ts" />

module solver.toolbox {
	"use strict";
	
	/**
	 * Works similar to its PHP counterpart, used to quickly read deeply nested values in an object/array tree without
	 * painstaking manual checks if the key exists at every level.
	 */
	export class DataBox {
		private value: any;
		
		public constructor(object: any) {
			this.value = object;
		}
		
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
		public get(key: string, defaultValue: any): any {
			if (typeof defaultValue === 'undefined') defaultValue = undefined; // Maybe not needed, but just in case.
		
			var keySegs = key.split('.');
		
			var value = this.value;
		
			if (typeof value !== 'object') return defaultValue;
		
			for (var i = 0, m = keySegs.length; i < m; i++) {
				if (value === null || typeof value !== 'object') return defaultValue;
				if (typeof value[keySegs[i]] === 'undefined') return defaultValue;
				value = value[keySegs[i]];
			}
		
			return value;
		}
		
		public getAll(): any {
			return this.value;
		}
	}
}