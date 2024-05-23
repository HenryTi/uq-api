"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyDbBase = void 0;
const _ = require("lodash");
const tool_1 = require("../../../tool");
const myCreatePool_1 = require("./myCreatePool");
const retries = 5;
const minMillis = 1;
const maxMillis = 100;
const ER_LOCK_WAIT_TIMEOUT = 1205;
const ER_LOCK_TIMEOUT = 1213;
const ER_LOCK_DEADLOCK = 1213;
const pools = [];
class MyDbBase {
    constructor(myDbs, dbName) {
        this.myDbs = myDbs;
        this.dbConfig = this.initConfig(dbName);
    }
    getPool() {
        return __awaiter(this, void 0, void 0, function* () {
            for (let p of pools) {
                let { config, pool } = p;
                if (_.isEqual(this.dbConfig, config) === true) {
                    return pool;
                }
            }
            let conf = Object.assign({}, this.dbConfig);
            conf.connectionLimit = 10;
            conf.waitForConnections = true;
            conf.multipleStatements = true;
            let newPool = (0, myCreatePool_1.myCreatePool)(conf);
            pools.push({ config: this.dbConfig, pool: newPool });
            return newPool;
        });
    }
    sql(sql, params, log) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.pool === undefined) {
                this.pool = yield this.getPool();
            }
            if (!sql)
                debugger;
            return yield new Promise((resolve, reject) => {
                let retryCount = 0;
                let isDevelopment = tool_1.env.isDevelopment;
                let handleResponse = (err, result) => {
                    if (err === null) {
                        if (log !== undefined) {
                            log.tries = retryCount;
                            log.close();
                        }
                        resolve(result);
                        return;
                    }
                    switch (+err.errno) {
                        case +ER_LOCK_WAIT_TIMEOUT:
                        case +ER_LOCK_TIMEOUT:
                        case +ER_LOCK_DEADLOCK:
                            if (isDevelopment === true)
                                tool_1.logger.error(`ERROR - ${err.errno} ${err.message}`);
                            ++retryCount;
                            if (retryCount > retries) {
                                if (isDevelopment === true)
                                    tool_1.logger.error(`Out of retries so just returning the error.`);
                                if (log !== undefined) {
                                    log.tries = retryCount;
                                    log.error = err.sqlMessage;
                                    log.close();
                                }
                                reject(err);
                                return;
                            }
                            let sleepMillis = Math.floor((Math.random() * maxMillis) + minMillis);
                            if (isDevelopment === true) {
                                tool_1.logger.error(sql + ': ---- Retrying request with', retries - retryCount, 'retries left. Timeout', sleepMillis);
                            }
                            return setTimeout(() => {
                                // debugger;
                                this.pool.query(sql, params, handleResponse);
                            }, sleepMillis);
                        default:
                            if (isDevelopment === true) {
                                // debugger;
                                tool_1.logger.error(err);
                                tool_1.logger.error(sql);
                            }
                            if (log !== undefined) {
                                log.tries = retryCount;
                                log.error = err.sqlMessage;
                                log.close();
                            }
                            reject(err);
                            return;
                    }
                };
                this.pool.query(sql, params, handleResponse);
            });
        });
    }
}
exports.MyDbBase = MyDbBase;
//# sourceMappingURL=MyDbBase.js.map