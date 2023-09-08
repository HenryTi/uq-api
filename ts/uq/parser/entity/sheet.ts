import {
    Sheet, Table, SheetStatement, SheetState, SheetAction,
    Returns, Bus, Entity, Pointer, Uq, VerifyStatement, VarPointer
} from '../../il';
import { PElement } from '../element';
import { Space } from '../space';
import { Token } from '../tokens';
import { PActionBase, ActionBaseSpace, HasInBusSpace } from './entity';
import { PContext } from '../pContext';
import { StateTo, SheetVerify } from '../../il/entity';
import { ReturnsSpace } from './returns';
import { PEntity } from './entity';

export class PSheet extends PActionBase<Sheet> {
    protected _parse() {
        this.entity.start.sheet = this.entity;
        this.setName();
        //this.parseRole();
        this.parseParams();
        if (this.ts.isKeyword('verify') === true) {
            this.ts.readToken();
            let verify = this.entity.verify = new SheetVerify(this.entity.uq);
            verify.sheet = this.entity;
            let parser = verify.parser(this.context);
            parser.parse();
        }
        if (this.ts.isKeyword('action') === true) {
            this.ts.readToken();
            let actionName: string;
            if (this.ts.token === Token.VAR) {
                actionName = this.ts.lowerVar;
                this.ts.readToken();
            }
            else {
                actionName = '$onsave';
            }
            this.parseAction(actionName);
        }
        for (; ;) {
            if (this.ts.token === Token.SEMICOLON as any) {
                this.ts.readToken();
                return;
            }
            else if (this.ts.token === Token.VAR) {
                let key = this.ts.lowerVar;
                switch (key) {
                    case 'state':
                        this.ts.readToken();
                        this.parseState();
                        continue;
                    case 'action':
                        this.ts.readToken();
                        this.parseAction();
                        continue;
                    default:
                        this.expect('state');
                        break;
                }
            }
            this.error('应该是state, action或;');
        }
    }

    private parseState() {
        let state = new SheetState(this.entity.uq);
        state.sheet = this.entity;
        let parser = state.parser(this.context)
        parser.parse();
        let sn = state.name;
        if (this.entity.states[sn] !== undefined ||
            this.entity.start.actions[sn] !== undefined) {
            this.error('state名称 ' + sn + ' 重复');
        }
        this.entity.states[sn] = state;
    }

    private parseAction(actionName?: string) {
        let action = new SheetAction(this.entity.uq, actionName);
        action.sheet = this.entity;
        action.sheetState = this.entity.start;
        let parser = action.parser(this.context);
        parser.parse();
        if (this.entity.start.addAction(action) === false) {
            this.error('action名字 ' + action.name + ' 重复');
        }
    }

    scanDoc2(): boolean {
        return false;
    }

    scan(space: Space): boolean {
        let ok = true;
        let names = this.entity.nameUnique();
        if (names !== undefined) {
            ok = false;
            this.log('sheet ' + this.entity.name + ' 字段重名: ' + names.join(','));
        }
        let { start, verify } = this.entity;
        let startActions = start.actions;
        if (startActions === undefined
            || Object.keys(startActions).length === 0) {
            ok = false;
            this.log('sheet ' + this.entity.name + ' 没有定义开始状态的action');
        }

        let sheetSpace = new SheetSpace(space, this.entity);
        if (verify) {
            if (verify.pelement.scan(sheetSpace) === false) ok = false;
        }
        for (let i in startActions) {
            let action = startActions[i];
            if (action.pelement.scan(sheetSpace) === false) ok = false;
        }
        if (this.childScan(sheetSpace) === false) ok = false;
        if (this.scanParamsTuid(space, this.entity, this.entity) === false) ok = false;
        return ok;
    }

    scan2(uq: Uq): boolean {
        let ok = true;
        if (this.scanParamsOwner(this.entity, this.entity) === false) ok = false;
        return ok;
    }
}

export class SheetSpace extends ActionBaseSpace {
    private sheet: Sheet;
    constructor(outer: Space, sheet: Sheet) {
        super(outer, sheet);
        this.sheet = sheet;
    }
    protected _states(): { [name: string]: any } { return this.sheet.states; }
}

export class PSheetState extends PElement {
    state: SheetState;
    constructor(state: SheetState, context: PContext) {
        super(state, context);
        this.state = state;
    }

    protected _parse() {
        if (this.ts.lowerVar === undefined) {
            this.expect('state名称');
        }
        let sn = this.state.name = this.ts.lowerVar;
        if (sn.length > 20) {
            this.error('state名称不能超过20字符');
        }
        switch (sn) {
            case 'start':
                this.error('state名称不能是start');
                break;
            case 'end':
                this.error('state名称不能是end');
                break;
            case 'delete':
                this.error('state名称不能是delete');
                break;
        }
        this.ts.readToken();
        switch (this.ts.lowerVar) {
            case 'reply':
                this.state.to = StateTo.reply;
                this.ts.readToken();
                break;
            case 'origin':
                this.state.to = StateTo.origin;
                this.ts.readToken();
                break;
        }
        if (this.ts.token !== Token.LBRACE) return;
        this.ts.readToken();
        for (; ;) {
            while (this.ts.token === Token.SEMICOLON as any) this.ts.readToken();
            if (this.ts.token === Token.RBRACE as any) {
                this.ts.readToken();
                //while (this.ts.token === Token.SEMICOLON as any) this.ts.readToken();
                return;
            }
            let key = this.ts.lowerVar;
            switch (key) {
                case 'action':
                    this.ts.readToken();
                    this.parseAction();
                    continue;
                default:
                    this.expect('action');
                    break;
            }
        }
    }

    private parseAction() {
        let action = new SheetAction(this.state.uq);
        action.sheet = this.state.sheet;
        action.sheetState = this.state;
        let parser = action.parser(this.context);
        parser.parse();
        if (this.state.addAction(action) === false) {
            this.error('action名字 ' + action.name + ' 重复');
        }
    }
}

export class PSheetVerify extends PEntity<SheetVerify> {
    protected _parse() {
        this.parseInBuses(this.entity);
        let returns = new Returns();
        returns.parser(this.context, this.entity.sheet).parse();
        this.entity.returns = returns;
        let statement = new VerifyStatement(undefined, this.entity);
        this.context.createStatements = statement.createStatements;
        statement.level = 0;
        let parser = statement.parser(this.context);
        parser.parse();
        this.entity.statement = statement;
    }
    scan(space: Space): boolean {
        space.setVarNo(1);
        space.setStatementNo(1);
        if (this.scanInBuses(space, this.entity) === false) return false;
        let hasInBusSpace = new HasInBusSpace(space, this.entity);
        let s2 = new ReturnsSpace(hasInBusSpace, this.entity.returns);
        //let s3 = new SheetActionSpace(s2, this.action);
        let ok = this.entity.statement.pelement.scan(s2);
        if (this.entity.returns.pelement.scan(s2) === false) ok = false;
        return ok;
    }

    scan2(uq: Uq): boolean {
        let ok = true;
        for (let ret of this.entity.returns.returns) {
            if (this.scanOwnerFields(this.entity, ret.fields) === false) ok = false;
        }
        return ok;
    }
}

export class PSheetAction extends PEntity<SheetAction> {
    protected _parse() {
        if (this.entity.name === undefined) {
            if (this.ts._var === undefined) {
                this.expect('应该是action名称. 一个sheet只能定义唯一的无名action，必须是第一个action');
            }
            this.entity.name = this.ts.lowerVar;
            this.ts.readToken();
        }
        // this.parseRole();
        this.parseInBuses(this.entity);
        let returns = this.entity.returns = new Returns();
        returns.parser(this.context, this.entity.sheet).parse();
        this.entity.returns = returns;
        let statement = new SheetStatement(undefined, this.entity);
        statement.inSheet = true;
        this.context.createStatements = statement.createStatements;
        statement.level = 0;
        let parser = statement.parser(this.context);
        parser.parse();
        this.entity.statement = statement;
    }

    scan(space: Space): boolean {
        space.setVarNo(1);
        space.setStatementNo(1);
        if (this.scanInBuses(space, this.entity) === false) return false;
        let hasInBusSpace = new HasInBusSpace(space, this.entity);
        let s2 = new ReturnsSpace(hasInBusSpace, this.entity.returns);
        let s3 = new SheetActionSpace(s2, this.entity);
        let ok = this.entity.statement.pelement.scan(s3);
        if (this.entity.returns.pelement.scan(s2) === false) ok = false;
        return ok;
    }

    scan2(uq: Uq): boolean {
        let ok = true;
        for (let ret of this.entity.returns.returns) {
            if (this.scanOwnerFields(this.entity, ret.fields) === false) ok = false;
        }
        return ok;
    }
}

const dollarVars = [
    // '$unit', '$user', '$date'
    // 'pagestart', 'pagesize',
    '$id', '$state', '$row', '$sheet_date', '$sheet_no', '$sheet_discription'
];
class SheetActionSpace extends Space {
    private action: SheetAction;
    constructor(outer: Space, action: SheetAction) {
        super(outer);
        this.action = action;
    }
    protected _getEntityTable(name: string): Entity & Table { return; }
    protected _getTableByAlias(alias: string): Table { return; }
    protected _varPointer(name: string, isField: boolean): Pointer {
        if (isField === false) {
            if (dollarVars.indexOf(name) >= 0) return new VarPointer();
        }
        return; // super._varPointer(name, isField);
    }
    protected _useBusFace(bus: Bus, face: string, arr: string, local: boolean): boolean {
        this.action.useBusFace(bus, face, arr, local);
        return true;
    }
}
