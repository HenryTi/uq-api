import {
    Field, Table, Arr, Entity, GroupType
    , Pointer, Return, Bus, Uq, TableVar, Enum, LocalTableBase
    , Const, ActionBase, Role, DataType, BizBase, BizEntity, BizFieldSpace, BizOut, UseOut,
    BizFromEntity,
    BizField
} from '../il';

export abstract class Space {
    readonly uq: Uq;
    private readonly outer: Space;

    constructor(outer: Space) {
        this.uq = outer?.uq;
        this.outer = outer;
    }

    protected _getEnum(name: string): Enum { return; }
    protected _getConst(name: string): Const { return; }
    protected _getArr(name: string): Arr { return; }
    protected _getBus(name: string): Bus { return; }
    protected _useBusFace(bus: Bus, face: string, arr: string, local: boolean): boolean { return false; }
    protected _states(): { [name: string]: any } { return; }
    protected _getEntity(name: string): Entity { return }
    protected _addTableVar(tableVar: TableVar): boolean { return }
    protected _getTableVar(name: string): TableVar { return }
    protected _isOrderSwitch(_orderSwitch: string): boolean { return }
    protected _setTransactionOff(off: boolean): boolean { return false; }
    protected _getActionBase(): ActionBase { return undefined; }
    protected _getBizFromEntityFromAlias(alias: string): BizFromEntity<BizEntity> { return undefined; }
    protected _getBizFromEntityFromName(name: string): BizFromEntity<BizEntity> { return undefined; }
    protected _getBizEntity(): BizEntity { return undefined; } // 当前space的主BizEntity
    protected _getBizField(names: string[]): BizField { return undefined; }
    protected _regUseBizOut(out: BizOut, to: boolean): UseOut { return undefined; }
    protected _getUse(name: string): { statementNo: number; obj: any; } { return undefined; }
    protected _addUse(name: string, statementNo: number, obj: any): boolean { return undefined; }
    protected abstract _getEntityTable(name: string): Entity & Table;
    protected abstract _getTableByAlias(alias: string): Table;
    protected abstract _varPointer(name: string, isField: boolean): Pointer;
    protected _varsPointer(names: string[]): [Pointer, string] { return; }
    protected get _isReadonly(): boolean { return; }

    get groupType(): GroupType { return GroupType.Single; }
    set groupType(value: GroupType) { }
    logOn() { this.outer.logOn(); }
    logOff() { this.outer.logOff(); }
    get inLoop(): boolean {
        if (this.outer === undefined) return false;
        return this.outer.inLoop;
    }
    getDataType(typeName: string): DataType {
        if (this.outer === undefined) return undefined;
        return this.outer.getDataType(typeName);
    }
    getRole(): Role {
        if (this.outer === undefined) return undefined;
        return this.outer.getRole();
    }
    getVarNo(): number {
        if (this.outer === undefined) return;
        let ret = this.outer.getVarNo();
        if (ret !== undefined) return ret;
    }
    setVarNo(value: number) {
        if (this.outer === undefined) return;
        this.outer.setVarNo(value);
    }
    newStatementNo(): number {
        if (this.outer === undefined) {
            return 1;
        }
        let ret = this.outer.newStatementNo();
        if (ret !== undefined) return ret;
    }
    setStatementNo(value: number) { }
    isOrderSwitch(orderSwitch: string): boolean {
        let ret = this._isOrderSwitch(orderSwitch);
        if (ret === undefined) {
            if (this.outer === undefined) return false;
            return this.outer._isOrderSwitch(orderSwitch);
        }
        return ret;
    }
    getEnum(name: string): Enum {
        let enm = this._getEnum(name);
        if (enm !== undefined) return enm;
        if (this.outer !== undefined)
            return this.outer.getEnum(name);
    }
    getConst(name: string): Const {
        let _const = this._getConst(name);
        if (_const !== undefined) return _const;
        if (this.outer !== undefined)
            return this.outer.getConst(name);
    }
    getArr(name: string) {
        let arr = this._getArr(name);
        if (arr !== undefined) return arr;
        if (this.outer !== undefined)
            return this.outer.getArr(name);
    }
    getStates(): { [name: string]: any } {
        let states = this._states();
        if (states !== undefined) return states;
        if (this.outer !== undefined) return this.outer.getStates();
    }
    getBus(name: string): Bus {
        let bus = this._getBus(name);
        if (bus !== undefined) return bus;
        if (this.outer !== undefined) return this.outer.getBus(name);
    }
    useBusFace(bus: Bus, face: string, arr: string, local: boolean): boolean {
        if (this._useBusFace(bus, face, arr, local) === true) return true;
        if (this.outer !== undefined) return this.outer.useBusFace(bus, face, arr, local);
        return false;
    }
    getEntity(name: string): Entity {
        let entity = this._getEntity(name);
        if (entity !== undefined) return entity;
        if (this.outer !== undefined)
            return this.outer.getEntity(name);
    }
    getEntityTable(name: string): Entity & Table {
        let entity = this._getEntityTable(name);
        if (entity !== undefined) return entity;
        if (this.outer !== undefined)
            return this.outer.getEntityTable(name);
    }
    // every BizEntity must have the same BizPhraseType
    getBizFromEntityArrFromAlias(alias: string): BizFromEntity<BizEntity> {
        let bizEntity = this._getBizFromEntityFromAlias(alias);
        if (bizEntity !== undefined) return bizEntity;
        if (this.outer !== undefined)
            return this.outer.getBizFromEntityArrFromAlias(alias);
    }
    getBizFromEntityArrFromName(name: string): BizFromEntity<BizEntity> {
        let bizEntity = this._getBizFromEntityFromName(name);
        if (bizEntity !== undefined) return bizEntity;
        if (this.outer !== undefined)
            return this.outer.getBizFromEntityArrFromName(name);
    }
    // 当前space对应的主BizEntity
    getBizEntity(): BizEntity {
        let ret = this._getBizEntity();
        if (ret !== undefined) return ret;
        if (this.outer !== undefined) return this.outer.getBizEntity();
    }
    getBizField(names: string[]): BizField {
        let ret = this._getBizField(names);
        if (ret !== undefined) return ret;
        if (this.outer !== undefined) return this.outer.getBizField(names);
    }
    regUseBizOut(out: BizOut, to: boolean): UseOut {
        let ret = this._regUseBizOut(out, to);
        if (ret !== undefined) return ret;
        return this.outer.regUseBizOut(out, to);
    }
    getUse(name: string): { statementNo: number; obj: any; } {  // return useStatement no
        let uv = this._getUse(name);
        if (uv === undefined) {
            if (this.outer !== undefined) {
                uv = this.outer.getUse(name);
            }
        }
        return uv;
    }
    addUse(name: string, statementNo: number, obj: any): boolean {
        let ret = this._addUse(name, statementNo, obj);
        if (ret !== undefined) return ret;
        return this.outer?.addUse(name, statementNo, obj);
    }
    getTableByAlias(alias: string): Table {
        let table = this._getTableByAlias(alias);
        if (table !== undefined) return table;
        if (this.outer !== undefined)
            return this.outer.getTableByAlias(alias);
    }
    varPointer(name: string, isField: boolean): Pointer {
        let pt = this._varPointer(name, isField);
        if (pt === undefined) {
            if (this.outer !== undefined) {
                pt = this.outer.varPointer(name, isField);
            }
        }
        return pt;
    }
    varsPointer(names: string[]): [Pointer, string] {
        let ret = this._varsPointer(names);
        if (ret !== undefined) return ret;
        if (this.outer === undefined) return;
        return this.outer.varsPointer(names);
    }
    addTableVar(tableVar: TableVar): boolean {
        let ret = this._addTableVar(tableVar);
        if (ret === undefined)
            return this.outer && this.outer.addTableVar(tableVar);
        return ret;
    }
    getTableVar(name: string): TableVar {
        let ret = this._getTableVar(name);
        if (ret !== undefined) return ret;
        return this.outer?.getTableVar(name);
    }
    getReturn(name: string): Return {
        if (this.outer !== undefined) return this.outer.getReturn(name);
        return;
    }
    getLocalTable(name: string): LocalTableBase {
        let ret: LocalTableBase = this.getTableVar(name);
        if (ret !== undefined) return ret;
        ret = this.outer?.getLocalTable(name);
        if (ret !== undefined) return ret;
        return this.getReturn(name);
    }
    getOwnerField(owner: string): Field {
        return;
    }
    setTransactionOff(off: boolean): boolean {
        if (this._setTransactionOff(off) === true) return true;
        if (this.outer === undefined) return true;
        return this.outer.setTransactionOff(off);
    }
    getActionBase(): ActionBase {
        let ret = this._getActionBase();
        if (ret !== undefined) return ret;
        return this.outer?.getActionBase();
    }
    // true: is in Biz From Statement
    get isReadonly(): boolean {
        let ret = this._isReadonly;
        if (ret !== undefined) return ret;
        return this.outer?.isReadonly;
    }
}
