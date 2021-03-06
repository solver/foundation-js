module solver.toolbox {
	"use strict";
	
	import encodeText = solver.toolbox.DomUtils.encodeText;
		
	/**
	 * A convenience tool for AJAX calls that captures common features and conventions used in projects.
	 *
	 * NOTE: Unlike jQuery, this tool supports Blob/File instances in input (you can upload files with an Ajax call).
	 * File uploads work on all browsers, except IE9 and earlier.
	 * 
	 * Depends on jQuery 1.9+.
	 * Depends on the jQuery Form plugin: http://malsup.com/jquery/form/ 
	 */
	export class Ajax {
		/**
		 * For producing unique identifiers in DOM.
		 */
		protected static serial = 0;
		
		public constructor(protected ctx: Ajax.Context) {}
		
		/**
		 * Sends an HTTP request to the server.
		 */
		public send(request: Ajax.Request): void {
			var ctx = this.ctx;
			
			if (request.method == null) request.method = 'POST';
			if (request.input == null) request.input = {};
			if (request.responseType) this.validateResponseType(request.responseType);

			if (ctx.injectedFields !== null) {
				var fields = ctx.injectedFields;
				
				for (var i in fields) if (fields.hasOwnProperty(i)) {
					request.input[i] = fields[i];
				} 
			}
			
			var details: Ajax.RequestDetails = {
				source: "direct",
				direct: {
					url: request.url,
					method: request.method,
					input: request.input,
				}
			};
			
			if (ctx.willSend) {
				if (ctx.willSend(details) === false) return;
			}
			
			var data: any;
			var processData: boolean;
			var contentType: string|boolean;
			var mimeType: string;
			
			if (request.method === 'GET' || !this.hasBlobs(request.input)) {
				// TODO: We should select this branch also for any method, if we have no Blob/File instances in input.
				data = request.input;	
				processData = true;
				contentType = 'application/x-www-form-urlencoded';
			} else {
				data = FormUtils.serializeObject(request.input);
				processData = false;
				contentType = false; // Automatically set by the browser XHR to "multipart/form-data".
			}
			
			var options: any = {
				data,
				processData,
				contentType,
				method: request.method,
						
				success: (data, textStatus, jqXhr) => {
					var response = this.decodeResponse(jqXhr);
					
					// FIXME: Is the status code here always 200, really?
					if (ctx.didSucceed) ctx.didSucceed(response, 200, details);
					if (request.didSucceed) request.didSucceed(response, 200, details);
				},				
				error: (jqXhr, textStatus, errorThrown) => {					
					var response = this.decodeResponse(jqXhr);
					
					if (ctx.didFail) ctx.didFail(response, jqXhr.status, details);
					if (request.didFail) request.didFail(response, jqXhr.status, details);
				}
			};
			
			if (request.responseType != null) options.dataType = request.responseType;
					
			$.ajax(request.url, options);
		}
		
		/**
		 * TODO: Consider removing this? Or find a way to make it usable with convertForm().
		 * 
		 * Like send(), but automatically points the browser if a non-error response arrives.
		 * 
		 * The URL is changed only after any user supplied handlers are invoked.
		 */
		public sendThenLoad(request: Ajax.Request, url): void {
			var oldDidSucceed = request.didSucceed;
			
			request.didSucceed = function (output) {
				if (oldDidSucceed) oldDidSucceed(output);
				location.assign(url);
			};
			
			this.send(request);
		}

		/**
		 * TODO: Consider removing this? Or find a way to make it usable with convertForm().
		 * 
		 * Like send(), but automatically reloads the current URL after a non-error response arrives.
		 * 
		 * The page is reloaded after any user supplied handlers are invoked.
		 */
		public sendThenReload(request: Ajax.Request): void {
			var oldDidSucceed = request.didSucceed;
			
			request.didSucceed = function (output) {
				if (oldDidSucceed) oldDidSucceed(output);
				location.reload(true);
			};
			
			this.send(request);
		}
		
		/**
		 * Sets up a form to be sent over XHR, with JS callbacks for success and failure.
		 */
		public convertForm(setup: Ajax.FormConfig): void {
			var ctx = this.ctx;
			var serial = Ajax.serial++;
			
			if (setup.responseType != null) this.validateResponseType(setup.responseType);
			
			var details: Ajax.RequestDetails = {
				source: "form",
				form: setup.form
			};
			
			(<any>$(setup.form)).ajaxForm({		
				dataType: setup.responseType != null ? setup.responseType : null,
				beforeSerialize: () => {
					this.addFieldsToForm(setup.form, serial, ctx.injectedFields);
					
					if (ctx.willSend) {
						if (ctx.willSend(details) === false) {
							this.removeFieldsFromForm(setup.form, serial);
							return false;
						}
					}
					
					if (setup.willSend) {
						if (setup.willSend(details) === false) {
							this.removeFieldsFromForm(setup.form, serial);
							return false;
						}
					}
				},
				success: (data, textStatus, jqXhr) => {
					var response = this.decodeResponse(jqXhr);
					
					this.removeFieldsFromForm(setup.form, serial);
					
					// FIXME: Is the status code here always 200, really?
					if (ctx.didSucceed) ctx.didSucceed(response, 200, details);
					if (setup.didSucceed) setup.didSucceed(response, 200, details);
				},				
				error: (jqXhr, textStatus, errorThrown) => {	
					var response = this.decodeResponse(jqXhr);
				
					this.removeFieldsFromForm(setup.form, serial);	
					
					if (ctx.didFail) ctx.didFail(response, jqXhr.status, details);
					if (setup.didFail) setup.didFail(response, jqXhr.status, details);
				}
			});
		}
		
		private decodeResponse(jqXhr: JQueryXHR) { 
			if (jqXhr.responseXML != null) return jqXhr.responseXML;
			if (jqXhr.responseJSON != null) return jqXhr.responseJSON;
			return jqXhr.responseText;
		}
		
		private hasBlobs(obj: any) {
			var hasBlobs = false;
			
			var scan = obj => {
				if (obj == null) return;
				
				if (obj instanceof Blob) {
					hasBlobs = true;
					return;
				}
				
				if (obj instanceof Object) {
					for (var i in obj) if (obj.hasOwnProperty(i)) {
						scan(obj[i]);
						// Short-circuit search.
						if (hasBlobs) return;
					}
				}
			};
			
			scan(obj);
			
			return hasBlobs;
		}
		
		private addFieldsToForm(form, serial, fields): void {
			if (fields == null) return;
			
			for (var i in fields) if (fields.hasOwnProperty(i)) {
				var field = $('<input type="hidden" name="' + encodeText(i) + '">');
				field.addClass('-Solver-Toolbox-Ajax-InjectedField' + serial);
				field.val(fields[i]);
			
				$(form).append(field);
			}
		}
		
		private removeFieldsFromForm(form, serial): void {
			$('.-Solver-Toolbox-Ajax-InjectedField' + serial, form).remove();
		}
		
		private validateResponseType(responseType): void {
			if (responseType == null) return;
			if (responseType === 'xml') return;
			if (responseType === 'json') return;
			if (responseType === 'text') return;
			
			throw new Error('Invalid responseType "' + responseType + '".');
		}
	}
		
	export module Ajax {
		export interface RequestHandlers {		
			/**
			 * Function to execute immediately before a request is sent. With form submissions, this handler is invoked
			 * before the form is serialized, so you have an opportunity to modify the fields, and this will be 
			 * reflected in the final request.
			 * 
			 * @return boolean|null
			 * Return true to continue sending the request (this is default if you return null or nothing).
			 * 
			 * Return false to abort the request before it's sent.
			 */
			willSend?: (details?: RequestDetails) => boolean|void;
		}
		
		export interface ResponseHandlers {			
			/**
			 * Function to execute on response success, before any call-specific handlers are invoked.
			 */
			didSucceed?: (output: any, status?: number, details?: RequestDetails) => void;
			
			/**
			 * Function to execute on response failure, before any call-specific handlers are invoked.
			 */
			didFail?: (log: any, status?: number, details?: RequestDetails) => void;
		}
		
		export interface ResponseType {			
			/**
			 * Preferred response type, one of "text", "json", "xml". Omit or pass null for auto-detection.
			 */
			responseType?: any;
		}
				
		export interface Request extends ResponseHandlers, ResponseType {
			/**
			 * URL to call on the server.
			 */
			url: string;

			/**
			 * HTTP call method. If not specified, defaults to POST.
			 */
			method?: string;
			
			/**
			 * Object of input fields to send to the server.
			 */
			input?: any;
		}
		
		export interface FormConfig extends RequestHandlers, ResponseHandlers, ResponseType {
			/**
			 * Form HTML element which will be converted to submit via AJAX.
			 * 
			 * The URL and method of the request will be taken from the form.
			 */
			form: HTMLElement;
		}
		
		/**
		 * Configures the ajax object instance. 
		 * 
		 * Any event handlers specified here (optional) will be invoked before the user-supplied handlers for a specific
		 * call (if any).
		 */
		export interface Context extends RequestHandlers, ResponseHandlers {
			/**
			 * A set of fields, as an object, that will be inserted into every AJAX call sent to the server.
			 * 
			 * Useful for specifying a CSRF token, API auth token etc.
			 */
			injectedFields?: any;
		}
		
		/**
		 * Supplied with some events for additional information.
		 */
		export interface RequestDetails {
			/**
			 * One of: "form", "direct".
			 */
			source: string;
			
			/**
			 * Defined only for source = "form", else not defined.
			 */
			form?: HTMLElement;
			
			/**
			 * Defined only for source = "direct", else not defined.
			 */
			direct?: {
				url: string;
				method: string;
				input: any;
			}
		}
	}
}