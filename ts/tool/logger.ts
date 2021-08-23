import { configure, getLogger } from "log4js";

/*
Standard log levels built-in to Log4J
Standard Level	intLevel
OFF	0
FATAL	100
ERROR	200
WARN	300
INFO	400
DEBUG	500
TRACE	600
ALL	Integer.MAX_VALUE
*/

configure({
	appenders: { 
		console: { type: 'console' } 
	},
	categories: { 
		default: {
			appenders: [ 'console' ], 
			level: 'debug'
		}
	}
});

export const logger = getLogger();
// logger.level = 'debug';
logger.debug('log4js replace console.');
