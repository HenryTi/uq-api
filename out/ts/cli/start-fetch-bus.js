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
const node_fetch_1 = require("node-fetch");
const config = require("config");
(function () {
    return __awaiter(this, void 0, void 0, function* () {
        let port = config.get('local-port');
        let url = `http://localhost:${port}/hello`;
        let resp = yield (0, node_fetch_1.default)(url);
        let ret = yield resp.text();
        console.log(ret);
        process.exit(999);
    });
})();
//# sourceMappingURL=start-fetch-bus.js.map