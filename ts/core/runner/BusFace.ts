import { EntityRunner } from "./EntityRunner";
import { centerApi } from "../centerApi";

type FieldType = 'id' | 'string' | 'number' | 'array';
interface Field {
    name: string;
    type: FieldType;
    fields?: string;
}
interface Face {
    // _: [] fieldArr[]，各表排序
    // $: [] field[] 主表
    [name: string]: Field[];
};
interface Bus { [face: string]: Face };
export const allBuses: {
    [url: string]: {
        [version: number]: Bus;
    };
} = {
};

export abstract class BusFace {
    protected readonly entityRunner: EntityRunner;
    accept: BusAccept;
    readonly busUrl: string;
    readonly bus: string;
    readonly busOwner: string;
    readonly busName: string;
    readonly faceName: string;
    readonly version: number;
    protected constructor(entityRunner: EntityRunner, url: string, bus: string, faceName: string, version: number) {
        this.entityRunner = entityRunner;
        this.bus = bus;
        let parts = url.split('/');
        this.busOwner = parts[0];
        this.busName = parts[1];
        this.busUrl = `${parts[0]}/${parts[1]}`;
        this.faceName = faceName;
        this.version = version;
    }

    async convert(busBody: string, version: number): Promise<string> {
        return busBody;
    }

    protected async getFaceSchema(version: number): Promise<Face> {
        let bus: Bus;
        let busAllVersions = allBuses[this.busUrl];
        if (busAllVersions) {
            bus = busAllVersions[version];
        }
        else {
            busAllVersions = {};
            allBuses[this.busUrl] = busAllVersions;
        }
        if (bus === undefined) {
            let schemaText = await centerApi.busSchema(this.busOwner, this.busName, version);
            if (!schemaText) {
                bus = null;
            }
            else {
                bus = this.buildBus(schemaText);
            }
            busAllVersions[version] = bus;
        }
        if (bus === null) return null;
        return bus[this.faceName];
    }

    private buildBus(schemaText: string): Bus {
        let bus: Bus = {};
        let schemas = JSON.parse(schemaText);
        for (let i in schemas) {
            bus[i.toLowerCase()] = {
                _: [{ name: '$', type: 'array' }],
                $: [],
            }
        }
        for (let i in schemas) {
            let schema = schemas[i];
            let face = bus[i.toLowerCase()];
            if (Array.isArray(schema) === true) {
                this.buildFace(bus, face, schema);
            }
            else {
                Object.assign(face, schema);
            }
        }
        return bus;
    }

    private buildFace(bus: Bus, face: Face, schema: Field[]) {
        let { _, $ } = face;
        for (let field of schema) {
            let { type } = field;
            switch (type) {
                case 'array':
                    let { name, fields } = field;
                    _.push(field);
                    face[name] = bus[fields.toLowerCase()].$;
                    break;
                default:
                    $.push(field);
                    break;
            }
        }
    }
}

interface BusContent {
    $: object;
    arrs: {
        [arr: string]: object[];
    }
}

interface BusAccept {
    inBuses: any[];
    dup: number;
}
export class BusFaceAccept extends BusFace {
    constructor(entityRunner: EntityRunner, url: string, bus: string, faceName: string, version: number, accept: BusAccept) {
        super(entityRunner, url, bus, faceName, version);
        this.accept = accept;
    }

    async convert(busBody: string, version: number): Promise<string> {
        let face = await this.getFaceSchema(version);
        if (face === null) {
            throw new Error(this.busNotExists(version));
        }
        let body = this.parseBusBody(busBody, face);
        let faceThisVersion = await this.getFaceSchema(this.version);
        if (faceThisVersion === null) {
            throw new Error(this.busNotExists(this.version));
        }
        let busText = this.buildBusBody(body, faceThisVersion);
        return busText;
    }

    private busNotExists(version: number) {
        return `bus ${this.busOwner}.${this.busName}.${this.faceName} version ${version} not exists`;
    }

    private parseBusBody(busBody: string, face: Face): BusContent[] {
        let ret: BusContent[] = [];
        let p = 0, bodyLen = busBody.length;
        function parseRow(fields: Field[]): object {
            let ret: object = {};
            let len = fields.length - 1;
            for (let i = 0; i < len; i++) {
                let { name } = fields[i];
                let tPos = busBody.indexOf('\t', p);
                if (tPos < 0) {
                    throw new Error('not \\t in parseRow in parseBusBody');
                }
                ret[name] = busBody.substring(p, tPos);
                p = tPos + 1;
            }
            let nPos = busBody.indexOf('\n', p);
            if (nPos < 0) {
                throw new Error('not \\n in parseRow in parseBusBody');
            }
            ret[fields[len].name] = busBody.substring(p, nPos);
            p = nPos + 1;
            return ret;
        }
        function parseArr(fields: Field[]): object[] {
            let ret = [];
            for (; p < bodyLen;) {
                ret.push(parseRow(fields));
                if (busBody.charCodeAt(p) === 10) {
                    ++p;
                    break;
                }
            }
            return ret;
        }
        function parseArrs(): { [arr: string]: object[] } {
            let ret: { [arr: string]: object[] } = {};
            let { _ } = face;
            let len = _.length;
            for (let i = 1; i < len; i++) {
                let { name } = _[i];
                let fields = face[name];
                ret[name] = parseArr(fields);
            }
            return ret;
        }
        for (; p < bodyLen;) {
            let $ = parseRow(face.$);
            let arrs = parseArrs();
            ret.push({ $, arrs });
        }
        return ret;
    }

    private buildBusBody(content: BusContent[], face: Face): string {
        let ret: string = '';
        for (let bc of content) {
            ret += this.buildRow(bc.$, face.$) + '\n';
            let { _ } = face;
            let len = _.length;
            for (let i = 1; i < len; i++) {
                let { name } = _[i];
                ret += this.buildArr(bc.arrs[name], face[name]) + '\n';
            }
        }
        return ret;
    }

    private buildRow(c: object, fields: Field[]): string {
        let ret = '';
        let sep = '';
        for (let f of fields) {
            let { name } = f;
            let v = c[name];
            ret += sep + (v ?? '');
            sep = '\t';
        }
        return ret;
    }

    private buildArr(arr: object[], fields: Field[]): string {
        let ret = '';
        for (let row of arr) {
            ret += this.buildRow(row, fields) + '\n';
        }
        return ret;
    }
}

export class BusFaceQuery extends BusFace {
    readonly query: boolean;
    constructor(entityRunner: EntityRunner, url: string, bus: string, faceName: string, version: number) {
        super(entityRunner, url, bus, faceName, version);
        this.query = true;
    }
}
