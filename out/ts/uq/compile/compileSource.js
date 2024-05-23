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
exports.compileDownload = exports.compileBizThoroughly = exports.compileBiz = exports.compileSource = void 0;
const Compiler_1 = require("./Compiler");
function compileSource(runner, unit, user, code) {
    return __awaiter(this, void 0, void 0, function* () {
        const compiler = new Compiler_1.Compiler(runner, unit, user);
        try {
            yield compiler.loadBizObjects();
            compiler.parseCode(code);
            compiler.parseBiz();
            compiler.scan();
            return yield compiler.buildDbResult();
        }
        catch (err) {
            return compiler.throwError(err);
        }
    });
}
exports.compileSource = compileSource;
function compileBiz(runner, unit, user) {
    return __awaiter(this, void 0, void 0, function* () {
        const compiler = new Compiler_1.Compiler(runner, unit, user);
        try {
            yield compiler.loadBizObjects();
            compiler.parseBiz();
            compiler.scan();
            return yield compiler.buildDbResult();
        }
        catch (err) {
            return compiler.throwError(err);
        }
    });
}
exports.compileBiz = compileBiz;
function compileBizThoroughly(runner, unit, user) {
    return __awaiter(this, void 0, void 0, function* () {
        const compiler = new Compiler_1.CompilerThoroughly(runner, unit, user);
        try {
            yield compiler.loadBizObjects();
            compiler.parseBiz();
            compiler.scan();
            return yield compiler.buildDbResult();
        }
        catch (err) {
            return compiler.throwError(err);
        }
    });
}
exports.compileBizThoroughly = compileBizThoroughly;
function compileDownload(runner, unit, user, fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        const compiler = new Compiler_1.Compiler(runner, unit, user);
        try {
            yield compiler.loadBizObjects();
            compiler.parseBiz();
            compiler.scan();
            let ret = compiler.getSource(fileName);
            return ret;
        }
        catch (err) {
            return compiler.throwError(err);
        }
    });
}
exports.compileDownload = compileDownload;
//# sourceMappingURL=compileSource.js.map