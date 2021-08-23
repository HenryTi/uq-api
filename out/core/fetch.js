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
exports.Fetch = void 0;
const node_fetch_1 = require("node-fetch");
const tool_1 = require("../tool");
class Fetch {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    get url() { return this.baseUrl; }
    ;
    get(url, params = undefined) {
        return __awaiter(this, void 0, void 0, function* () {
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
            return yield this.innerFetch(url, 'GET');
        });
    }
    post(url, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.innerFetch(url, 'POST', params);
        });
    }
    innerFetch(url, method, body) {
        return __awaiter(this, void 0, void 0, function* () {
            tool_1.logger.debug('innerFetch ' + method + '  ' + this.baseUrl + url);
            var headers = new node_fetch_1.Headers();
            headers.append('Accept', 'application/json'); // This one is enough for GET requests
            headers.append('Content-Type', 'application/json'); // This one sends body
            let res = yield node_fetch_1.default(this.baseUrl + url, {
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
            let json = yield res.json();
            if (json.error !== undefined) {
                throw json.error;
            }
            if (json.ok === true) {
                return json.res;
            }
            return json;
        });
    }
}
exports.Fetch = Fetch;
//# sourceMappingURL=fetch.js.map