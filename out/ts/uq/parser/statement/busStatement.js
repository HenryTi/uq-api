"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBusStatement = void 0;
const tokens_1 = require("../tokens");
const il_1 = require("../../il");
const PStatement_1 = require("../PStatement");
class PBusStatement extends PStatement_1.PStatement {
    constructor(busStatement, context) {
        super(busStatement, context);
        this.fieldColl = {};
        this.busStatement = busStatement;
    }
    _parse() {
        if (this.ts.token !== tokens_1.Token.VAR) {
            this.expect('bus 名称');
        }
        this.busStatement.busName = this.ts.lowerVar;
        this.ts.readToken();
        if (this.ts.token === tokens_1.Token.DOT) {
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.VAR) {
                this.expect('bus face 名称');
            }
            this.busStatement.faceName = this.ts.lowerVar;
            this.ts.readToken();
        }
        else {
            this.busStatement.faceName = '$';
        }
        const cmds = ['set', 'into', 'to', 'defer', 'local'];
        if (this.ts.token !== tokens_1.Token.VAR || this.ts.varBrace === true) {
            this.ts.expect(...cmds);
        }
        switch (this.ts.lowerVar) {
            default:
                this.ts.expect(...cmds);
                break;
            case 'stamp':
                this.busStatement.action = il_1.BusAction.Stamp;
                this.ts.readToken();
                let stamp = new il_1.ValueExpression();
                stamp.parser(this.context).parse();
                this.busStatement.stamp = stamp;
                break;
            case 'defer':
                this.busStatement.action = il_1.BusAction.Defer;
                this.ts.readToken();
                if (this.ts.token === tokens_1.Token.NUM) {
                    let { dec } = this.ts;
                    if (dec === 0) {
                        this.busStatement.defer = 0;
                        this.ts.readToken();
                    }
                    else if (dec === 1) {
                        this.busStatement.defer = 1;
                        this.ts.readToken();
                    }
                    else {
                        this.ts.error('Bus Defer can only be 0 or 1');
                    }
                }
                else {
                    this.busStatement.defer = 1;
                }
                break;
            case 'set':
                this.busStatement.action = il_1.BusAction.Set;
                this.ts.readToken();
                this.parseFields();
                break;
            case 'into':
                this.busStatement.action = il_1.BusAction.Into;
                this.ts.readToken();
                this.ts.assertToken(tokens_1.Token.VAR);
                this.busStatement.arrName = this.ts.lowerVar;
                this.ts.readToken();
                this.ts.assertKey('add');
                this.ts.readToken();
                this.parseFields();
                break;
            case 'to':
                this.busStatement.action = il_1.BusAction.To;
                this.ts.readToken();
                let toUser = new il_1.ValueExpression();
                toUser.parser(this.context).parse();
                this.busStatement.toUser = toUser;
                break;
            case 'local':
                this.busStatement.action = il_1.BusAction.Local;
                this.ts.readToken();
                break;
            case 'query':
                this.busStatement.action = il_1.BusAction.Query;
                this.ts.readToken();
                this.parseFields();
                break;
            case 'send':
                this.ts.error('语句 bus [bus.face] send 已经作废了！');
                break;
        }
        this.ts.assertToken(tokens_1.Token.SEMICOLON);
        this.ts.readToken();
    }
    parseFields() {
        for (;;) {
            if (this.ts.token !== tokens_1.Token.VAR)
                this.ts.expect('bus字段名');
            let name = this.ts.lowerVar;
            this.ts.readToken();
            this.ts.assertToken(tokens_1.Token.EQU);
            this.ts.readToken();
            let expression = new il_1.ValueExpression();
            let parser = expression.parser(this.context);
            parser.parse();
            this.fieldColl[name] = expression;
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
                continue;
            }
            break;
        }
    }
    scan(space) {
        let stat = this.busStatement;
        let ok = true;
        let faceFields, arrFields;
        let bus = space.getBus(stat.busName);
        if (bus === undefined) {
            this.log(stat.busName + ' is not valid bus');
            ok = false;
            bus = space.getBus(stat.busName);
            return false;
        }
        else {
            stat.bus = bus;
            let { faceName, arrName, action } = stat;
            let { shareSchema } = bus;
            let faceSchema = shareSchema.faceSchemas[faceName];
            if (faceSchema === undefined) {
                this.log(`unkown face ${faceName}`);
                return false;
            }
            if (faceSchema.type === 'accept' && action === il_1.BusAction.Query) {
                this.log(faceName + ' can not bus query');
                return false;
            }
            if (faceSchema.type === 'query') {
                if (action !== il_1.BusAction.Query) {
                    this.log(faceName + ' can do bus query only');
                    return false;
                }
                faceFields = faceSchema.param;
            }
            else {
                faceFields = faceSchema.busFields;
            }
            if (faceFields === undefined) {
                this.log(stat.faceName + ' is not bus face name');
                return false;
            }
            if (arrName !== undefined) {
                let f = faceFields.find(f => f.name === arrName);
                if (f === undefined) {
                    this.log(arrName + ' is not valid bus arr name');
                    ok = false;
                }
                arrFields = f.fields;
            }
            space.useBusFace(bus, faceName, arrName, this.busStatement.action === il_1.BusAction.Local);
            bus.outFaces[faceName] = true;
        }
        stat.fields = [];
        let { fields: busFields, action, busName, faceName, arrName } = stat;
        for (let name in this.fieldColl) {
            let value = this.fieldColl[name];
            if (action === il_1.BusAction.Set || action === il_1.BusAction.Query) {
                if (faceFields.find(v => v.name === name) === undefined) {
                    this.log(`${name} is not defined in bus ${busName}.${faceName}`);
                    ok = false;
                }
            }
            else if (action === il_1.BusAction.Into) {
                if (arrFields.find(v => v.name === name) === undefined) {
                    this.log(`${name} is not defined in bus ${busName}.${faceName} arr ${arrName}`);
                    ok = false;
                }
            }
            if (value.pelement.scan(space) === false) {
                ok = false;
            }
        }
        if (action === il_1.BusAction.Local) {
            let { bus, faceName } = this.busStatement;
            let accept = bus.accepts[faceName];
            if (accept) {
                accept.hasLocal = true;
            }
            else {
                ok = false;
                this.log(`${bus}/${faceName} does not has a accept, so can not use BUS x Local`);
            }
            return ok;
        }
        else if (action === il_1.BusAction.Stamp) {
            let { stamp } = stat;
            if (stamp.pelement.scan(space) === false) {
                ok = false;
            }
            return ok;
        }
        let fields;
        switch (action) {
            default: return;
            case il_1.BusAction.Into:
                fields = arrFields;
                break;
            case il_1.BusAction.Set:
            case il_1.BusAction.Query:
                fields = faceFields;
                break;
        }
        for (let f of fields) {
            let { name, type } = f;
            busFields.push({ name: name, type: type, value: this.fieldColl[name] });
        }
        /*
        let actionBase = space.getActionBase();
        if (actionBase) {
            if (actionBase.type === 'accept') {
                let varOperand = new VarOperand();
                varOperand._var = ['$importing'];
                varOperand.pelement = new PVarOperand(varOperand, this.context);
                let exp = new ValueExpression();
                exp.atoms = [varOperand];
                exp.pelement = new PValueExpression(exp, this.context);
                this.busStatement.importing = exp;
            }
        }
        */
        return ok;
    }
    scan2(uq) {
        let { bus, faceName } = this.busStatement;
        if (!bus)
            return false;
        let { accepts, busOwner, busName } = bus;
        let accept = accepts[faceName];
        if (accept && accept.hasLocal === false && accept.isQuery === false) {
            this.log(`cannot write and accept ${busOwner}/${busName}/${faceName} in one uq`);
            return false;
        }
        return true;
    }
}
exports.PBusStatement = PBusStatement;
//# sourceMappingURL=busStatement.js.map