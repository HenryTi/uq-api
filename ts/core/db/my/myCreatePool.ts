import { createPool, PoolOptions } from "mysql2";

const fieldTypes: {
    [type: string]: string;
} = {};

export function myCreatePool(poolOptions: PoolOptions) {
    const options = Object.assign({}, poolOptions, {
        typeCast: function (field: any, next: any) {
            const { type } = field;
            if (fieldTypes[type] === undefined) {
                fieldTypes[type] = type;
            }
            switch (type) {
                case "DECIMAL":
                case "NEWDECIMAL":
                    let value = field.string();
                    return (value === null) ? null : Number(value);
            }
            return next();
        }
    })
    return createPool(options);
}
