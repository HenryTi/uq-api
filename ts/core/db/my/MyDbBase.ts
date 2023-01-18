import { createPool, Pool/*, MysqlError, TypeCast*/ } from 'mysql2';
import * as _ from 'lodash';
import { logger, env } from '../../../tool';
import { DbBase } from '../Db';

const retries = 5;
const minMillis = 1;
const maxMillis = 100;

const ER_LOCK_WAIT_TIMEOUT = 1205;
const ER_LOCK_TIMEOUT = 1213;
const ER_LOCK_DEADLOCK = 1213;

interface DbConfigPool {
    config: any;
    pool: Pool;
}

const pools: DbConfigPool[] = [];

export abstract class MyDbBase implements DbBase {
    private pool: Pool;
    protected readonly dbConfig: any;
    protected abstract connectionConfig(): any;

    constructor() {
        this.dbConfig = this.connectionConfig();
        //this.dbLogger = new DbLogger(dbs.$uqDb);
    }
    // protected createBuilder() { return new MyBuilder(this.dbName, this.hasUnit, this.twProfix); }

    private async getPool(): Promise<Pool> {
        for (let p of pools) {
            let { config, pool } = p;
            if (_.isEqual(this.dbConfig, config) === true) {
                return pool;
            }
        }
        let conf = Object.assign(this.dbConfig);
        // conf.timezone = 'UTC';
        // conf.typeCast = castField;
        conf.connectionLimit = 10;
        conf.waitForConnections = true;
        // conf.acquireTimeout = 10000;
        conf.multipleStatements = true;
        //conf.charset = 'utf8mb4';
        //let newPool = await this.createPool(conf);
        let newPool = createPool(conf);
        pools.push({ config: this.dbConfig, pool: newPool });
        return newPool;
    }
    protected async exec(sql: string, values: any[], log?: any /* SpanLog*/): Promise<any> {
        if (this.pool === undefined) {
            this.pool = await this.getPool();
        }
        if (!sql) debugger;
        return await new Promise<any>((resolve, reject) => {
            let retryCount = 0;
            let isDevelopment = env.isDevelopment;
            let handleResponse = (err: any, result: any) => {
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
                        if (isDevelopment === true) logger.error(`ERROR - ${err.errno} ${err.message}`);
                        ++retryCount;
                        if (retryCount > retries) {
                            if (isDevelopment === true) logger.error(`Out of retries so just returning the error.`);
                            if (log !== undefined) {
                                log.tries = retryCount;
                                log.error = err.sqlMessage;
                                log.close();
                            }
                            reject(err);
                            return;
                        }
                        let sleepMillis = Math.floor((Math.random() * maxMillis) + minMillis)
                        if (isDevelopment === true) {
                            logger.error(sql + ': ---- Retrying request with', retries - retryCount, 'retries left. Timeout', sleepMillis);
                        }
                        return setTimeout(() => {
                            // debugger;
                            this.pool.query(sql, values, handleResponse);
                        }, sleepMillis);
                    default:
                        if (isDevelopment === true) {
                            debugger;
                            logger.error(err);
                            logger.error(sql);
                        }
                        if (log !== undefined) {
                            log.tries = retryCount;
                            log.error = err.sqlMessage;
                            log.close();
                        }
                        reject(err);
                        return;
                }
            }
            this.pool.query(sql, values, handleResponse);
        });
    }
    async sql(sql: string, params: any[]): Promise<any> {
        let result = await this.exec(sql, params);
        return result;
    }
}