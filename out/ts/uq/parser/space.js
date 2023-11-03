"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Space = void 0;
const il_1 = require("../il");
class Space {
    constructor(outer) {
        this.uq = outer === null || outer === void 0 ? void 0 : outer.uq;
        this.outer = outer;
    }
    _getEnum(name) { return; }
    _getConst(name) { return; }
    _getArr(name) { return; }
    _getBus(name) { return; }
    _getSheet(name) { return; }
    _useBusFace(bus, face, arr, local) { return false; }
    _states() { return; }
    _getEntity(name) { return; }
    _addTableVar(tableVar) { return; }
    _getTableVar(name) { return; }
    _isOrderSwitch(_orderSwitch) { return; }
    _setTransactionOff() { return false; }
    _getActionBase() { return undefined; }
    _getBizBase(bizName) { return undefined; }
    _getBizEntity(name) { return undefined; }
    _getBizFrom() { return undefined; }
    _getUse(name) { return undefined; }
    _addUse(name, statementNo, obj) { return undefined; }
    _varsPointer(names) { return; }
    _getBin() { return; }
    get groupType() { return il_1.GroupType.Single; }
    set groupType(value) { }
    get inLoop() {
        if (this.outer === undefined)
            return false;
        return this.outer.inLoop;
    }
    getDataType(typeName) {
        if (this.outer === undefined)
            return undefined;
        return this.outer.getDataType(typeName);
    }
    getRole() {
        if (this.outer === undefined)
            return undefined;
        return this.outer.getRole();
    }
    getVarNo() {
        if (this.outer === undefined)
            return;
        let ret = this.outer.getVarNo();
        if (ret !== undefined)
            return ret;
    }
    setVarNo(value) {
        if (this.outer === undefined)
            return;
        this.outer.setVarNo(value);
    }
    newStatementNo() {
        if (this.outer === undefined) {
            return 1;
        }
        let ret = this.outer.newStatementNo();
        if (ret !== undefined)
            return ret;
    }
    setStatementNo(value) {
        /*
        if (this.outer === undefined) return;
        this.outer.setStatementNo(value);
        */
    }
    isOrderSwitch(orderSwitch) {
        let ret = this._isOrderSwitch(orderSwitch);
        if (ret === undefined) {
            if (this.outer === undefined)
                return false;
            return this.outer._isOrderSwitch(orderSwitch);
        }
        return ret;
    }
    getEnum(name) {
        let enm = this._getEnum(name);
        if (enm !== undefined)
            return enm;
        if (this.outer !== undefined)
            return this.outer.getEnum(name);
    }
    getConst(name) {
        let _const = this._getConst(name);
        if (_const !== undefined)
            return _const;
        if (this.outer !== undefined)
            return this.outer.getConst(name);
    }
    getArr(name) {
        let arr = this._getArr(name);
        if (arr !== undefined)
            return arr;
        if (this.outer !== undefined)
            return this.outer.getArr(name);
    }
    getStates() {
        let states = this._states();
        if (states !== undefined)
            return states;
        if (this.outer !== undefined)
            return this.outer.getStates();
    }
    getBus(name) {
        let bus = this._getBus(name);
        if (bus !== undefined)
            return bus;
        if (this.outer !== undefined)
            return this.outer.getBus(name);
    }
    getSheet(name) {
        let sheet = this._getSheet(name);
        if (sheet !== undefined)
            return sheet;
        if (this.outer !== undefined)
            return this.outer.getSheet(name);
    }
    useBusFace(bus, face, arr, local) {
        if (this._useBusFace(bus, face, arr, local) === true)
            return true;
        if (this.outer !== undefined)
            return this.outer.useBusFace(bus, face, arr, local);
        return false;
    }
    getEntity(name) {
        let entity = this._getEntity(name);
        if (entity !== undefined)
            return entity;
        if (this.outer !== undefined)
            return this.outer.getEntity(name);
    }
    getEntityTable(name) {
        let entity = this._getEntityTable(name);
        if (entity !== undefined)
            return entity;
        if (this.outer !== undefined)
            return this.outer.getEntityTable(name);
    }
    getBizEntity(name) {
        let bizEntity = this._getBizEntity(name);
        if (bizEntity !== undefined)
            return bizEntity;
        if (this.outer !== undefined)
            return this.outer.getBizEntity(name);
    }
    getBizFrom() {
        let ret = this._getBizFrom();
        if (ret !== undefined)
            return ret;
        if (this.outer !== undefined)
            return this.outer.getBizFrom();
    }
    getUse(name) {
        let uv = this._getUse(name);
        if (uv === undefined) {
            if (this.outer !== undefined) {
                uv = this.outer.getUse(name);
            }
        }
        return uv;
    }
    addUse(name, statementNo, obj) {
        var _a;
        let ret = this._addUse(name, statementNo, obj);
        if (ret !== undefined)
            return ret;
        return (_a = this.outer) === null || _a === void 0 ? void 0 : _a.addUse(name, statementNo, obj);
    }
    getTableByAlias(alias) {
        let table = this._getTableByAlias(alias);
        if (table !== undefined)
            return table;
        if (this.outer !== undefined)
            return this.outer.getTableByAlias(alias);
    }
    varPointer(name, isField) {
        let pt = this._varPointer(name, isField);
        if (pt === undefined) {
            if (this.outer !== undefined) {
                pt = this.outer.varPointer(name, isField);
            }
        }
        return pt;
    }
    varsPointer(names) {
        let ret = this._varsPointer(names);
        if (ret !== undefined)
            return ret;
        if (this.outer === undefined)
            return;
        return this.outer.varsPointer(names);
    }
    getBin() {
        let ret = this._getBin();
        if (ret !== undefined)
            return ret;
        if (this.outer === undefined)
            return;
        return this.outer.getBin();
    }
    addTableVar(tableVar) {
        let ret = this._addTableVar(tableVar);
        if (ret === undefined)
            return this.outer && this.outer.addTableVar(tableVar);
        return ret;
    }
    getTableVar(name) {
        var _a;
        let ret = this._getTableVar(name);
        if (ret !== undefined)
            return ret;
        return (_a = this.outer) === null || _a === void 0 ? void 0 : _a.getTableVar(name);
    }
    getReturn(name) {
        if (this.outer !== undefined)
            return this.outer.getReturn(name);
        return;
    }
    getLocalTable(name) {
        var _a;
        let ret = this.getTableVar(name);
        if (ret !== undefined)
            return ret;
        ret = (_a = this.outer) === null || _a === void 0 ? void 0 : _a.getLocalTable(name);
        if (ret !== undefined)
            return ret;
        return this.getReturn(name);
    }
    getOwnerField(owner) {
        return;
    }
    setTransactionOff() {
        if (this._setTransactionOff() === true)
            return true;
        if (this.outer === undefined)
            return true;
        return this.outer.setTransactionOff();
    }
    getActionBase() {
        var _a;
        let ret = this._getActionBase();
        if (ret !== undefined)
            return ret;
        return (_a = this.outer) === null || _a === void 0 ? void 0 : _a.getActionBase();
    }
    getBizBase(bizName) {
        var _a;
        let ret = this._getBizBase(bizName);
        if (ret !== undefined)
            return ret;
        return (_a = this.outer) === null || _a === void 0 ? void 0 : _a.getBizBase(bizName);
    }
}
exports.Space = Space;
//# sourceMappingURL=space.js.map