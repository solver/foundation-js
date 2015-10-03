module solver.lab {
	"use strict";
	
	import ObjectUtils = solver.toolbox.ObjectUtils;
	
	/**
	 * Partial (encoder-only) of PHP's Solver\Lab\FluentUrlCodec. See that class for details on every method.
	 *
	 * IMPORTANT: If you update this code, make sure you also update the PHP version of it!
	 */
	export class FluentUrlCodec {
		public static encode(chain: FluentUrlCodec.FluentChain): string {
			function writeValue(input, root = false) {
				if (input == null) {
					if (root) FluentUrlCodec.throwRootMustBeCollection();
					return null;
				}
				
				else if (typeof input === 'object') {
					var literals = [];
					for (var i = 0; input.hasOwnProperty(i); i++) {
						var valueLiteral = writeValue(input[i]);
						if (valueLiteral == null) break;
						literals.push(valueLiteral);
					}
					
					// TODO: Faster way?
					if (Object.keys(input).length > i) {
						for (var key in input) if (input.hasOwnProperty(key)) {
							var value = input[key];
							// TODO: Faster way to detect int keys?
							if (key.match(/^\d+$/) && key < i) continue;
							var keyLiteral = FluentUrlCodec.percentEncode(key);
							var valueLiteral = writeValue(value);
							if (valueLiteral == null) continue;
							literals.push(keyLiteral + '=' + valueLiteral);
						}
					}
					
					if (root) {
						return literals.join(';');
					} else {
						return literals.length ? '(' + literals.join(';') + ')' : null;
					}
				}
				
				else if (typeof input === 'number') {
					if (root) FluentUrlCodec.throwRootMustBeCollection();
					return (input + '').replace('+', '');
				}
				
				else if (typeof input === 'string') {
					if (root) FluentUrlCodec.throwRootMustBeCollection();
					return FluentUrlCodec.percentEncode(input);
				}
					
				else if (typeof input === 'boolean') {
					if (root) FluentUrlCodec.throwRootMustBeCollection();
					return input ? '1' : '0';
				}
				
				else {
					// TODO: More specific error with path etc.?
					throw new Error('Unsupported value type in the input.');
				}
			}
			
			var url = '/';
			var count = chain.length;
			
			for (var segment of chain) {
				if (typeof segment === 'string') {
					var name = segment;
					var params = null;
				} else {
					var name = segment.name;
					var params = segment.params;
				}
				
				url += FluentUrlCodec.percentEncode(name);
				
				if (params != null) {
					var encodedParams = writeValue(params, true);
					if (encodedParams != null) url += ';' + encodedParams;
				}
				
				url += '/';
			}
			
			return url;
		}
			
		protected static percentEncode(str: string): string {
			return encodeURIComponent(str)
				.replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16))
				.replace('%20', '+');
		}
			
		protected static percentDecode(str: string): string {
			return decodeURIComponent(str.replace('+', ' '));
		}
	
		protected static throwRootMustBeCollection() {
			throw new Error('Root value must be a collection.');
		}
	}
	
	export module FluentUrlCodec {
		export type FluentChain = Array<string | {name: string; params: any}>;
	}
}