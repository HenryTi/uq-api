import { Request } from 'express';
import { consts } from '../core';

export function buildDbNameFromReq(req: Request) {
    let { params, baseUrl } = req;
    let { db } = params;
    const test = '/test/';
    let p = baseUrl.indexOf('/test/');
    if (p >= 0) {
        p += test.length;
        if (baseUrl.substring(p, p + db.length) === db) {
            db += consts.$test;
        }
    }
    return db;
}