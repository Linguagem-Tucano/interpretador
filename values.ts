// deno-lint-ignore-file no-explicit-any
import Environment from "./environment.ts";

export type ValueType = 
| "NullVal"
| "NumberVal"
| "RealVal"
| "StringVal"
| "BooleanVal"
| "NumberList"
| "RealList"
| "StringList"
| "BooleanList"
| "ObjectVal";


export interface RuntimeVal {
    type: ValueType;
    value: any;
}

export interface NullVal extends RuntimeVal {
    type: "NullVal";
    value: "nulo";
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

export interface ObjectVal extends RuntimeVal {
    type: "ObjectVal";
    value: string;
    className: string;
    env: Environment;
}

export function MK_NULL():NullVal {
    return {type:"NullVal",value:"nulo"} as NullVal;
}