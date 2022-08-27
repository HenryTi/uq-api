"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const log4js_1 = require("log4js");
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
(0, log4js_1.configure)({
    appenders: {
        console: { type: 'console' }
    },
    categories: {
        default: {
            appenders: ['console'],
            level: 'debug'
        }
    }
});
exports.logger = (0, log4js_1.getLogger)();
// logger.level = 'debug';
exports.logger.debug('log4js replace console.');
//# sourceMappingURL=logger.js.map