/// <reference path="../lib.ts" />

/**
 * Utilities for working with date & time data.
 */
module solver.toolbox.DateUtils {
	/**
	 * TODO: Replace this with a more comprehensive RFC 3339 or ISO 8601 support.
	 * 
	 * @param dateString
	 * Standard SQL format date or datetime string: "YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS".
	 * 
	 * @return Date
	 * Date for the input date string. If the input has no time component, output time is set to 12PM.
	 */
	export function fromSqlString(dateString: string): Date {
		var segs = dateString.split(/[- :]/);
		
		if (segs.length >= 6) {
			return new Date(+segs[0], (+segs[1]) - 1, +segs[2], +segs[3], +segs[4], +segs[5]);
		} else {
			return new Date(+segs[0], (+segs[1]) - 1, +segs[2], 12, 0, 0);
		}
	}
	
	
	/**
	 * TODO: Replace this with a more comprehensive RFC 3339 or ISO 8601 support.
	 * 
	 * @param date
	 * If you skip this parameter or pass null, the current date & time are taken.
	 * 
	 * @param includeTime
	 * Whether to render just a date, or include the time part of the string in the output.
	 * 
	 * @return
	 * Standard SQL format date or datetime string: "YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS".
	 */
	export function toSqlString(date: Date = null, includeTime: boolean = false): string {
		var pad = (str, length) => {
			str += '';
			
			while (str.length < length) {
				str = '0' + str;
			}
			
			return str;
		};
		
		if (date == null) date = new Date();
		
		var dateString = date.getFullYear() + '-' + pad(date.getMonth() + 1, 2) + '-' + pad(date.getDate(), 2);
		
		if (includeTime) {
			dateString += ' ' + pad(date.getHours(), 2) + ':' + pad(date.getMinutes() + 1, 2) + ':' + pad(date.getSeconds(), 2);
		}
		
		return dateString;
	}
}