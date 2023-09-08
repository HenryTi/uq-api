"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Modified = void 0;
const constStrs = [
    '$', '-', '#', '$role', 'access', 'bus', 'tuid', 'action', 'sheet', 'query',
    'history', 'pending', 'book', 'enum', 'const', 'pull', 'map', 'tuid.arr', 'templet',
    'tag', 'proc', 'id', 'idx', 'ix', 'act', 'sysproc', 'queue', 'biz', 'biz.spec', 'biz.atom'
];
;
class Modified {
    constructor(context, uq /*, runner: UqBuildApi, options: CompileOptions*/) {
        this.modifiedEntities = [];
        this.constStrsColl = {};
        this.context = context;
        this.uq = uq;
        // this.runner = runner;
        // this.options = options;
    }
}
exports.Modified = Modified;
//# sourceMappingURL=modified.js.map