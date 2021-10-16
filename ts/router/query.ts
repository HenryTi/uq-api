import {Router} from 'express';
import {EntityRunner, packReturn, RouterBuilder} from '../core';

export function buildQueryRouter(router:Router, rb:RouterBuilder) {
    rb.entityPost(router, 'query', '/:name', queryProcess);
    rb.entityPost(router, 'query', '-page/:name', pageQueryProcess);
}

export const queryProcess = async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
    let params:any[] = [];
    let fields = schema.fields;
    let len = fields.length;
    for (let i=0; i<len; i++) {
        params.push(body[fields[i].name]);
    }
    let result:any;
    let {proxy, auth} = schema;
    if (auth !== undefined) {
        auth = 'tv_' + auth;
        if (runner.isExistsProcInDb(auth) === false) {
            await runner.createProcInDb(auth);
        }
    }
    if (proxy !== undefined) {
        proxy = 'tv_' + proxy;
        if (runner.isExistsProcInDb(proxy) === false) {
            await runner.createProcInDb(proxy);
        }
        result = await runner.queryProxy(name, unit, user, body.$$user, params);
    }
    else {
        result = await runner.query(name, unit, user, params);
    }
    let data = packReturn(schema, result);
    return data;
}

export const pageQueryProcess = async (unit:number, user:number, name:string, db:string, urlParams:any, runner:EntityRunner, body:any, schema:any) => {
    let pageStart = body['$pageStart'];
    if (pageStart !== undefined) {
        let page = (schema.returns as any[]).find(v => v.name === '$page');
        if (page !== undefined) {
            let startField = page.fields[0];
            if (startField !== undefined) {
                switch (startField.type) {
                    case 'date':
                    case 'time':
                    case 'datetime': pageStart = new Date(pageStart); break;
                }
            }
        }
    }
    let params:any[] = [pageStart, body['$pageSize']];
    let fields = schema.fields;
    let len = fields.length;
    for (let i=0; i<len; i++) {
        params.push(body[fields[i].name]);
    }
    let result:any;
    let {proxy, auth} = schema;
    if (auth !== undefined) {
        auth = 'tv_' + auth;
        if (runner.isExistsProcInDb(auth) === false) {
            await runner.createProcInDb(auth);
        }
    }
    if (proxy !== undefined) {
        proxy = 'tv_' + proxy;
        if (runner.isExistsProcInDb(proxy) === false) {
            await runner.createProcInDb(proxy);
        }
        result = await runner.queryProxy(name, unit, user, body.$$user, params);
    }
    else {
        result = await runner.query(name, unit, user, params);
    }
    let data = packReturn(schema, result);
    return data;
    //let result = await runner.query(name, proxy!==undefined, unit, user, params);
    //let data = packReturn(schema, result);
    //return data;
}