"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fetch = void 0;
const node_fetch_1 = require("node-fetch");
const tool_1 = require("../tool");
class Fetch {
    constructor(baseUrl) {
        if (baseUrl.endsWith('/') === false) {
            baseUrl += '/';
        }
        this.baseUrl = baseUrl;
    }
    get url() { return this.baseUrl; }
    ;
    async get(url, params = undefined) {
        if (params) {
            let keys = Object.keys(params);
            if (keys.length > 0) {
                let c = '?';
                for (let k of keys) {
                    let v = params[k];
                    if (v === undefined)
                        continue;
                    if (v === null)
                        continue;
                    url += c + k + '=' + encodeURIComponent(params[k]);
                    c = '&';
                }
            }
        }
        return await this.innerFetch(url, 'GET');
    }
    async post(url, params) {
        return await this.innerFetch(url, 'POST', params);
    }
    async innerFetch(url, method, body) {
        tool_1.logger.debug('innerFetch ' + method + '  ' + this.baseUrl + url);
        var headers = new node_fetch_1.Headers();
        headers.append('Accept', 'application/json'); // This one is enough for GET requests
        headers.append('Content-Type', 'application/json'); // This one sends body
        let res = await (0, node_fetch_1.default)(this.baseUrl + url, {
            headers: {
                "Content-Type": 'application/json',
                "Accept": 'application/json',
                //"Authorization": 'this.apiToken',
                //"Access-Control-Allow-Origin": '*'
            },
            method: method,
            body: JSON.stringify(body),
        });
        if (res.status !== 200) {
            tool_1.logger.error(this.baseUrl + url, res.statusText, res.status);
            throw {
                error: res.statusText,
                code: res.status,
            };
            //logger.debug('statusCode=', response.statusCode);
            //logger.debug('statusMessage=', response.statusMessage);
        }
        let json = await res.json();
        if (json.error !== undefined) {
            throw json.error;
        }
        if (json.ok === true) {
            return json.res;
        }
        return json;
    }
}
exports.Fetch = Fetch;
//# sourceMappingURL=fetch.js.map