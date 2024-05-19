import {
    BizBud, BizBudArr, EnumSysTable, Field, IOPeer
    , IOPeerArr, IOPeerID, IOPeerOptions, IOPeers, JoinType
    , JsonTableColumn, PeerIDKey, PeerType, bigIntField, charField, decField, jsonField
} from "../../../il";
import { BudDataType } from "../../../il/Biz/BizPhraseType";
import { DbContext } from "../../dbContext";
import {
    ExpAnd, ExpCmp, ExpComplex, ExpEQ, ExpField, ExpFunc
    , ExpFuncDb, ExpFuncInUq, ExpNum, ExpSelect, ExpStr, ExpVal, ExpVar
} from "../../sql";
import { Factory } from "../../sql/factory";
import { LockType } from "../../sql/select";
import { EntityTable, FromJsonTable } from "../../sql/statementWithFrom";

const a = 'a', b = 'b';

export interface JsonContext {
    readonly context: DbContext;
    readonly factory: Factory;
    readonly transFuncName: string;
    readonly expJson: ExpVal;
}

export abstract class JsonVal {
    static jsonTable = 't';
    static siteAtomApp = '$siteAtomApp';
    static otherSite = '$otherSite';
    static vJson = '$json';

    protected jsonContext: JsonContext;
    protected readonly ioPeers: IOPeers;

    constructor(jsonContext: JsonContext, ioPeers: IOPeers) {
        this.jsonContext = jsonContext;
        this.ioPeers = ioPeers;
    }

    build(bud: BizBud): { peerName: string; val: ExpVal; } {
        let peerName: string;
        let val: ExpVal;
        const { name, dataType } = bud;
        let peer: IOPeer;
        if (this.ioPeers !== undefined) {
            peer = this.ioPeers.peers[name];
        }
        if (peer !== undefined) {
            const { to, name: pName } = peer;
            peerName = to ?? pName;
        }
        else {
            peerName = name;
        }
        if (dataType === BudDataType.arr) {
            val = this.buildArr(bud as BizBudArr, peer as IOPeerArr);
        }
        else {
            let expVal = this.buildVal(bud);
            switch (dataType) {
                default:
                    if (peer !== undefined) {
                        switch (peer.peerType) {
                            default:
                                val = expVal;
                                break;
                            case PeerType.peerOptions:
                                val = this.transOptions(peer as IOPeerOptions, expVal);
                                break;
                        }
                    }
                    else {
                        val = expVal;
                    }
                    break;
                case BudDataType.ID:
                    val = this.transID(peer as IOPeerID, expVal);
                    break;
                case BudDataType.date:
                    val = new ExpFunc('DATEDIFF', expVal, new ExpStr('1970-01-01'));
                    break;
            }
        }
        return { peerName, val };
    }

    protected buildArr(bud: BizBudArr, peer: IOPeerArr): ExpVal {
        const { name: arrName } = bud;
        const { props } = bud;
        const { factory, expJson } = this.jsonContext;
        let select = factory.createSelect();
        select.lock = LockType.none;
        const columns: JsonTableColumn[] = [];
        for (let [name, bud] of props) {
            let field: Field;
            switch (bud.dataType) {
                default: debugger; break;
                case BudDataType.int: field = bigIntField(name); break;
                case BudDataType.dec: field = decField(name, 24, 6); break;
                case BudDataType.arr: field = jsonField(name); break;
                case BudDataType.ID:
                case BudDataType.date:
                case BudDataType.char:
                case BudDataType.str: field = charField(name, 400); break;
            }
            let ret: JsonTableColumn = {
                field,
                path: `$."${name}"`,
            };
            columns.push(ret);
        };

        let arrObj = this.buildArrObj(bud, peer);
        select.column(new ExpFunc('JSON_ARRAYAGG', arrObj));
        select.from(new FromJsonTable(JsonVal.jsonTable, expJson, `$."${arrName}"[*]`, columns));
        return new ExpSelect(select);
    }

    private buildArrObj(bud: BizBudArr, peer: IOPeerArr): ExpVal {
        const { peers } = peer;
        const { props } = bud;
        let objParams: ExpVal[] = [];
        let jsonVal = new JsonValInArr(this.jsonContext, peers, this);
        for (let [, bud] of props) {
            let { peerName, val } = jsonVal.build(bud);
            objParams.push(new ExpStr(peerName), val);
        }
        return new ExpFunc('JSON_OBJECT', ...objParams);
    }

    protected abstract buildVal(bud: BizBud): ExpVal;
    protected abstract buildValFromKey(key: PeerIDKey): ExpVal;

    protected transID(peer: IOPeerID, val: ExpVal): ExpVal {
        const { context, transFuncName } = this.jsonContext;
        const { id: ioAppID } = peer;
        if (ioAppID === undefined) {
            return val;
        }
        const { unique, id } = ioAppID;
        const { site } = context;
        if (unique === undefined) {
            return new ExpFuncDb('$site',
                `${site}.${transFuncName}`,
                new ExpFuncInUq('bud$id',
                    [
                        ExpNum.num0, ExpNum.num0, ExpNum.num1, ExpNum.num_1/*no signal when null keys */,
                        new ExpVar(JsonVal.siteAtomApp), new ExpNum(ioAppID.id),
                    ],
                    true
                ),
                val);
        }
        else {
            let keyVal = this.buildKeyVal(peer);
            return new ExpFuncDb('$site',
                `${site}.${id}.${transFuncName}`,
                keyVal,
                val
            );
        }
    }

    private buildKeyVal(peer: IOPeerID) {
        let { keys, id } = peer;
        if (keys === undefined || keys.length === 0) {
            const { unique } = id;
            if (unique !== undefined) {
                return new ExpNum(unique.id);
            }
            return new ExpVar(JsonVal.otherSite);
        }
        let len = keys.length;
        let valKey = this.buildValFromKey(keys[0]);
        for (let i = 1; i < len; i++) {
            let valKeyi = this.buildValFromKey(keys[i]);
            valKey = new ExpFuncInUq('bud$id',
                [
                    ExpNum.num0, ExpNum.num0, ExpNum.num1, ExpNum.num_1/*no signal when null keys */,
                    valKey, valKeyi,
                ],
                true
            );
        }
        return valKey;
    }

    protected transOptions(peer: IOPeerOptions, val: ExpVal): ExpVal {
        const { factory } = this.jsonContext;
        const { options, isValue } = peer;
        const select = factory.createSelect();
        select.lock = LockType.none;
        select.column(new ExpField('id', a))
        select.from(new EntityTable(EnumSysTable.bizPhrase, false, a));
        let wheres: ExpCmp[] = [
            new ExpEQ(new ExpField('base', a), new ExpNum(options.id)),
        ]
        if (isValue === true) {
            wheres.push(new ExpEQ(new ExpField('memo', a), val));
        }
        else {
            select.join(JoinType.join, new EntityTable(EnumSysTable.bizPhrase, false, b))
                .on(new ExpEQ(new ExpField('id', b), new ExpField('base', a)));
            wheres.push(new ExpEQ(new ExpField('name', a), new ExpFunc(factory.func_concat, new ExpField('name', b), new ExpStr('.'), val)));
        }
        select.where(new ExpAnd(...wheres));
        return new ExpSelect(select);
    }
}

export class JsonValInMain extends JsonVal {
    protected buildValFromKey(key: PeerIDKey): ExpVal {
        let { bud } = key;
        let { val } = this.build(bud);
        return val;
    }

    protected buildVal(bud: BizBud) {
        let suffix: string;
        switch (bud.dataType) {
            default: debugger; throw new Error('unknown data type ' + bud.dataType);
            case BudDataType.ID:
            case BudDataType.char:
            case BudDataType.str:
                suffix = undefined;
                break;
            case BudDataType.date:
                // return this.buildDateVal(bud);
                suffix = undefined;
                break;
            case BudDataType.int:
                suffix = 'RETURNING SIGNED';
                break;
            case BudDataType.dec:
                suffix = 'RETURNING DECIMAL';
                break;
        }
        return new ExpFunc('JSON_VALUE', this.jsonContext.expJson, new ExpComplex(new ExpStr(`$."${bud.name}"`), undefined, suffix));
    }
}

export class JsonValInArr extends JsonVal {
    private readonly jsonValMain: JsonVal;

    constructor(jsonContext: JsonContext, ioPeers: IOPeers, jsonValMain: JsonVal) {
        super(jsonContext, ioPeers);
        this.jsonValMain = jsonValMain;
    }
    protected buildValFromKey(key: PeerIDKey): ExpVal {
        let { bud, sameLevel } = key;
        if (sameLevel === false) {
            let { val } = this.jsonValMain.build(bud);
            return val;
        }
        else {
            let { val } = this.build(bud);
            return val;
        }
    }

    protected override buildArr(bud: BizBud, peer: IOPeerArr): ExpVal {
        throw new Error('should not be here');
    }

    protected buildVal(bud: BizBud): ExpVal {
        return new ExpField(bud.name, JsonVal.jsonTable);
    }
}
