export * from './jobs';

/*
import { syncDbs } from "../jobs/syncDbs";

export function startSync() {
    let timeout:number = process.env.NODE_ENV === 'development'?
        6000 : 60*1000;
    setTimeout(sync, timeout);
}

async function sync() {
    try {
        logger.debug('sync at: ' + new Date().toLocaleTimeString());
        await syncDbs();
    }
    catch (err) {
        logger.error('sync error: ', err);
    }
    finally {
        setTimeout(sync, 60*1000);
    }
}
*/