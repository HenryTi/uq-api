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
        if (baseUrl.endsWith('/') === false) {
            baseUrl += '/';
        }
        this.baseUrl = baseUrl;
    }
    get url() { return this.baseUrl; }
    ;
    get(url_1) {
        return __awaiter(this, arguments, void 0, function* (url, params = undefined) {
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
    innerFetchLog(url, method) {
        let fullUrl = this.baseUrl + url;
        tool_1.logger.debug('innerFetch ' + method + '  ' + fullUrl);
    }
    innerFetch(url, method, body) {
        return __awaiter(this, void 0, void 0, function* () {
            this.innerFetchLog(url, method);
            let fullUrl = this.baseUrl + url;
            //var headers = new Headers();
            //headers.append('Accept', 'application/json'); // This one is enough for GET requests
            //headers.append('Content-Type', 'application/json'); // This one sends body
            let res = yield (0, node_fetch_1.default)(fullUrl, {
                headers: {
                    "Content-Type": 'application/json',
                    "Accept": 'application/json',
                    //"Authorization": 'this.apiToken',
                    //"Access-Control-Allow-Origin": '*'
                },
                method,
                body: JSON.stringify(body),
            });
            if (res.status !== 200) {
                const { statusText, status } = res;
                tool_1.logger.error(fullUrl, statusText, status);
                throw {
                    error: statusText,
                    code: status,
                };
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