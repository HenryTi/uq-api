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
exports.Out = void 0;
const crypto_1 = require("crypto");
const node_fetch_1 = require("node-fetch");
class Out {
    constructor(outName, outUrl, outKey, outPassword, value) {
        this.outName = outName;
        this.outUrl = outUrl;
        this.outKey = outKey;
        this.outPassword = outPassword;
        this.value = value;
    }
    push() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let ret = yield (0, node_fetch_1.default)(this.outUrl, {
                    method: 'POST',
                    headers: this.buildHeader(),
                    body: JSON.stringify(this.buildBody()),
                });
                let retJson = yield ret.json();
                if (this.isPushSuccess(retJson) === true)
                    return;
                return retJson;
            }
            catch (err) {
                debugger;
                throw err;
            }
        });
    }
    buildHeader() {
        return {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
    }
    buildBody() {
        let stamp = Date.now();
        let strData = JSON.stringify(this.value);
        let token = md5(stamp + strData + this.outPassword);
        let uiq = 0; // queueId;
        return {
            data: this.value,
            stamp,
            appKey: this.outKey,
            appkey: this.outKey,
            token,
            act: this.outName,
            uiq,
        };
    }
    isPushSuccess(retJson) {
        return true;
    }
}
exports.Out = Out;
function md5(content) {
    return (0, crypto_1.createHash)('md5').update(content).digest('hex');
}
//# sourceMappingURL=Out.js.map