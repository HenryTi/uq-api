import { Space } from '../space';
import { Token } from '../tokens';
import { BusStatement, ValueExpression, BusAction, BusField, Uq } from '../../il';
import { PStatement } from '../PStatement';
import { PContext } from '../pContext';
import { FaceAcceptSchema, FaceQuerySchema } from '../../il/busSchema';

export class PBusStatement extends PStatement {
    private fieldColl: { [name: string]: ValueExpression } = {};
    busStatement: BusStatement;
    constructor(busStatement: BusStatement, context: PContext) {
        super(busStatement, context);
        this.busStatement = busStatement;
    }
    protected _parse() {
        if (this.ts.token !== Token.VAR) {
            this.expect('bus 名称');
        }
        this.busStatement.busName = this.ts.lowerVar;
        this.ts.readToken();
        if (this.ts.token === Token.DOT) {
            this.ts.readToken();
            if (this.ts.token as any !== Token.VAR) {
                this.expect('bus face 名称');
            }
            this.busStatement.faceName = this.ts.lowerVar;
            this.ts.readToken();
        }
        else {
            this.busStatement.faceName = '$';
        }
        const cmds = ['set', 'into', 'to', 'defer', 'local'];
        if (this.ts.token !== Token.VAR || this.ts.varBrace === true) {
            this.ts.expect(...cmds);
        }
        switch (this.ts.lowerVar) {
            default: this.ts.expect(...cmds); break;
            case 'stamp':
                this.busStatement.action = BusAction.Stamp;
                this.ts.readToken();
                let stamp: ValueExpression = new ValueExpression();
                stamp.parser(this.context).parse();
                this.busStatement.stamp = stamp;
                break;
            case 'defer':
                this.busStatement.action = BusAction.Defer;
                this.ts.readToken();
                if (this.ts.token === Token.NUM) {
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
                this.busStatement.action = BusAction.Set;
                this.ts.readToken();
                this.parseFields();
                break;
            case 'into':
                this.busStatement.action = BusAction.Into;
                this.ts.readToken();
                this.ts.assertToken(Token.VAR);
                this.busStatement.arrName = this.ts.lowerVar;
                this.ts.readToken();
                this.ts.assertKey('add');
                this.ts.readToken();
                this.parseFields();
                break;
            case 'to':
                this.busStatement.action = BusAction.To;
                this.ts.readToken();
                let toUser: ValueExpression = new ValueExpression();
                toUser.parser(this.context).parse();
                this.busStatement.toUser = toUser;
                break;
            case 'local':
                this.busStatement.action = BusAction.Local;
                this.ts.readToken();
                break;
            case 'query':
                this.busStatement.action = BusAction.Query;
                this.ts.readToken();
                this.parseFields();
                break;
            case 'send':
                this.ts.error('语句 bus [bus.face] send 已经作废了！');
                break;
        }
        this.ts.assertToken(Token.SEMICOLON);
        this.ts.readToken();
    }

    private parseFields() {
        for (; ;) {
            if (this.ts.token !== Token.VAR) this.ts.expect('bus字段名');
            let name = this.ts.lowerVar;
            this.ts.readToken();
            this.ts.assertToken(Token.EQU);
            this.ts.readToken();
            let expression = new ValueExpression();
            let parser = expression.parser(this.context);
            parser.parse();
            this.fieldColl[name] = expression;
            if (this.ts.token === Token.COMMA) {
                this.ts.readToken();
                continue;
            }
            break;
        }
    }

    scan(space: Space): boolean {
        let stat = this.busStatement;
        let ok = true;
        let faceFields: BusField[], arrFields: BusField[];
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
            if (faceSchema.type === 'accept' && action === BusAction.Query) {
                this.log(faceName + ' can not bus query');
                return false;
            }
            if (faceSchema.type === 'query') {
                if (action !== BusAction.Query) {
                    this.log(faceName + ' can do bus query only');
                    return false;
                }
                faceFields = (faceSchema as FaceQuerySchema).param;
            }
            else {
                faceFields = (faceSchema as FaceAcceptSchema).busFields;
            }
            if (faceFields === undefined) {
                this.log(stat.faceName + ' is not bus face name');
                return false;
            }
            if (arrName !== undefined) {
                let f: BusField = faceFields.find(f => f.name === arrName);
                if (f === undefined) {
                    this.log(arrName + ' is not valid bus arr name');
                    ok = false;
                }
                arrFields = f.fields;
            }
            space.useBusFace(bus, faceName, arrName, this.busStatement.action === BusAction.Local);
            bus.outFaces[faceName] = true;
        }
        stat.fields = [];
        let { fields: busFields, action, busName, faceName, arrName } = stat;

        for (let name in this.fieldColl) {
            let value = this.fieldColl[name];
            if (action === BusAction.Set || action === BusAction.Query) {
                if (faceFields.find(v => v.name === name) === undefined) {
                    this.log(`${name} is not defined in bus ${busName}.${faceName}`);
                    ok = false;
                }
            }
            else if (action === BusAction.Into) {
                if (arrFields.find(v => v.name === name) === undefined) {
                    this.log(`${name} is not defined in bus ${busName}.${faceName} arr ${arrName}`);
                    ok = false;
                }
            }
            if (value.pelement.scan(space) === false) {
                ok = false;
            }
        }
        if (action === BusAction.Local) {
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
        else if (action === BusAction.Stamp) {
            let { stamp } = stat;
            if (stamp.pelement.scan(space) === false) {
                ok = false;
            }
            return ok;
        }


        let fields: BusField[];
        switch (action) {
            default: return;
            case BusAction.Into: fields = arrFields; break;
            case BusAction.Set:
            case BusAction.Query: fields = faceFields; break;
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

    scan2(uq: Uq): boolean {
        let { bus, faceName } = this.busStatement;
        if (!bus) return false;
        let { accepts, busOwner, busName } = bus;
        let accept = accepts[faceName];
        if (accept && accept.hasLocal === false && accept.isQuery === false) {
            this.log(`cannot write and accept ${busOwner}/${busName}/${faceName} in one uq`);
            return false;
        }
        return true;
    }
}
