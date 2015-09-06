module solver.lab {
	"use strict";
	
	import Ajax = solver.toolbox.Ajax; 
	import encodeText = solver.toolbox.DomUtils.encodeText;
	
	/**
	 * Use these methods (bound to "this") to Ajax.Context as global handlers to get standard error display & repeat
	 * submit protection for forms.
	 * 
	 * TODO: Move in-code comments to here and explain in a way a human can understand, how this works.
	 * 
	 * Requires jQuery 1.5+.
	 */
	export class StandardFormHandler {
		// We hold here forms being submitted who haven't receive a response yet, to avoid double submits.
		protected formsInProgress: Array<HTMLElement> = [];
		
		public willSend(details: Ajax.RequestDetails) {
			if (!details.form) return;
			
			if (this.hasFormIn(this.formsInProgress, details.form)) {
				// TODO: Replace this with better UI demonstrating the form is processed (and maybe disable controls).
				// Making this thing a class and injecting a handler for this occurence is another option.
				alert('This form is being submitted right now. Please wait.');
			}
			
			this.addFormIn(this.formsInProgress, details.form);
			
			// Reset event contents (mostly to indicate a form is being processed, as displaying the log reset them again).
			$('.-events', details.form).html('').hide();
		}
		
		public didSucceed(output: any, status: number, details: Ajax.RequestDetails) {
			this.removeFormIn(this.formsInProgress, details.form);
		}
		
		public didFail(log: any, status: number, details: Ajax.RequestDetails) {
			if (!details.form) return;
			
			this.removeFormIn(this.formsInProgress, details.form);
			
			this.displayLog(details.form, log);
		}
		
		protected hasFormIn(formList: Array<HTMLElement>, form: HTMLElement): boolean {
			for (var i = formList.length - 1; i >= 0; i--) {
				if (formList[i] === form) {
					return true;
				}
			}
			
			return false;
		}
		
		protected addFormIn(formList: Array<HTMLElement>, form: HTMLElement) {
			formList.push(form);
		}
		
		protected removeFormIn(formList: Array<HTMLElement>, form: HTMLElement) {
			// TRICKY: It's important to loop in reverse here as we'll be removing elements via splice as we loop.
			for (var i = formList.length - 1; i >= 0; i--) {
				if (formList[i] === form) {
					formList.splice(i, 1);
				}
			}
		}
		
		protected displayLog(form: HTMLElement, log: Array<any>) {
			function addEventToSlot(slot, event) {
				slot.show().append('<span class="event -' + event.type + '">' + encodeText(event.message) + '</span>');
			}
	
			if (log instanceof Array) {
				var eventSlots = $('.-events', form);
				
				// Reset event contents.
				eventSlots.html('').hide();
					
				// Build an index of event fields to fill in.
				var eventSlotsByPath = {};
				
				for (var i = 0, l = eventSlots.length; i < l; i++) {
					var path: string = eventSlots.eq(i).attr('data');
					if (path === null) path = '';
					eventSlotsByPath[eventSlots.eq(i).attr('data')] = eventSlots.eq(i);
				}
				
				// Fill in the events.
				if (log) for (var i = 0, l: number = log.length; i < l; i++) {
					var event = log[i];
					var path: string = event.path;
					
					if (path == null) path = '';
	
					// Every event tries to find its "best home" to be added to, in this order:
					// 
					// 1. An event in the exact slot it belongs in: data="path".
					// 2. An event slot with the exact path preceded by a ~ (read below to see what these do): data="~path".
					// 3. We start popping off path segments from right and try ~path until we find a match.
					// 4. If there's still no match by the time we pop off all path segments (matcing data="~"), we give up.
					// 
					// The ~path syntax means "put here errors for this path and its descendant paths". You can choose to
					// use tilde to take advantage of this automatic routing, or remove the tilde to disable it.
					if (eventSlotsByPath[path]) {
						addEventToSlot(eventSlotsByPath[path], event);
					} else {
						for (;;) {
							if (eventSlotsByPath['~' + path]) {
								addEventToSlot(eventSlotsByPath['~' + path], event);
								break;
							}
							
							if (path === '') break;
							
							var pathSegs = path.split('.');
							pathSegs.pop();
							path = pathSegs.join('.');
						}
					}
				}
			}
		}
	}
}