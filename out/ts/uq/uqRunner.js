"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UqRunner = void 0;
// import config from '../config';
// import { UqBuildApi } from '../core';
// import { CompileOptions } from '../compile';
const il_1 = require("./il");
const parser_1 = require("./parser");
class UqRunner {
    constructor(compilerVersion, log) {
        this.compilerVersion = compilerVersion;
        this.log = log || ((text) => true);
        this.ok = true;
        this.uq = new il_1.Uq();
    }
    setLog(log) {
        this.log = log;
    }
    parse(input, fileName, isSys = false) {
        try {
            let ts = new parser_1.TokenStream(this.log, input);
            ts.file = fileName;
            let context = isSys === true ? new parser_1.PSysContext(ts) : new parser_1.PContext(ts);
            let parser = this.uq.bizParser(context);
            parser.parse();
        }
        catch (err) {
            this.ok = false;
            if (typeof err !== 'string')
                this.log(err.message);
        }
    }
    // 新传入的uq代码，保存已编译好的。后续操作，只处理最新的。
    // 老的uq代码，随后编译
    anchorLatest() {
        this.uq.biz.anchorLatest();
    }
    isLatest(phrase) {
        return this.uq.biz.isLatest(phrase);
    }
    parseBorn(bornCode) {
        for (let bes of bornCode) {
            try {
                let ts = new parser_1.TokenStream(this.log, bes);
                ts.file = '$born';
                let context = new parser_1.PSysContext(ts);
                let parser = this.uq.parser(context);
                parser.parse();
            }
            catch (err) {
                this.log('$born code error');
                this.log(bes);
            }
        }
    }
    scan() {
        let pelement = this.uq.pelement;
        if (pelement === undefined)
            return;
        this.uq.buildEmptyRole();
        // 解析生成的代码, 必须在scan之后解析
        // 因为生成代码要用到scan之后的值
        let bornCode = [];
        this.uq.eachChild(entity => {
            let pelement = entity.pelement;
            if (pelement === undefined)
                return;
            return pelement.born(bornCode);
        });
        this.parseBorn(bornCode);
        let ret = pelement.scan(undefined);
        if (ret === false)
            this.ok = false;
    }
}
exports.UqRunner = UqRunner;
//# sourceMappingURL=uqRunner.js.map