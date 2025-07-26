// deno-lint-ignore-file no-explicit-any
export type ValueType = 
| "NullVal"
| "NumberVal"
| "RealVal"
| "StringVal"
| "BooleanVal"
| "NumberList"
| "RealList"
| "StringList"
| "BooleanList";


export interface RuntimeVal {
    type: ValueType;
    value: any;
}

export interface NullVal extends RuntimeVal {
    type: "NullVal";
    value: "null";
}

export interface NumberVal extends RuntimeVal {
    type: "NumberVal";
    value: number;
}

export interface RealVal extends RuntimeVal {
    type: "RealVal";
    value: number;
}

export interface StringVal extends RuntimeVal {
    type: "StringVal";
    value: string;
}

export interface BooleanVal extends RuntimeVal {
    type: "BooleanVal";
    value: boolean;
}

export interface NumberList extends RuntimeVal {
    type: "NumberList";
    value: NumberVal[];
}

export interface RealList extends RuntimeVal {
    type: "RealList";
    value: RealVal[];
}

export interface StringList extends RuntimeVal {
    type: "StringList";
    value: StringVal[];
}

export interface BooleanList extends RuntimeVal {
    type: "BooleanList";
    value: BooleanVal[];
}

export function MK_NULL():NullVal {
    return {type:"NullVal",value:"null"} as NullVal;
}