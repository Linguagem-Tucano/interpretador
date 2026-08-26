// deno-lint-ignore-file no-explicit-any
import Environment from './environment.ts';

export type ValueType = 'NullVal' | 'NumberVal' | 'RealVal' | 'StringVal' | 'BooleanVal' | 'ListVal' | 'ObjectVal' | 'ReturnVal';

export interface RuntimeVal {
    type: ValueType;
    value: any;
}

export interface NullVal extends RuntimeVal {
    type: 'NullVal';
    value: 'nulo';
}

export interface NumberVal extends RuntimeVal {
    type: 'NumberVal';
    value: number;
}

export interface RealVal extends RuntimeVal {
    type: 'RealVal';
    value: number;
}

export interface StringVal extends RuntimeVal {
    type: 'StringVal';
    value: string;
}

export interface BooleanVal extends RuntimeVal {
    type: 'BooleanVal';
    value: boolean;
}

export interface ListVal extends RuntimeVal {
    type: 'ListVal';
    value: RuntimeVal[];
    listType: ValueType;
}

export interface ObjectVal extends RuntimeVal {
    type: 'ObjectVal';
    value: string;
    className: string;
    env: Environment;
}

export interface ReturnVal extends RuntimeVal {
    type: 'ReturnVal';
    value: RuntimeVal;
}

export function MK_NULL(): NullVal {
    return { type: 'NullVal', value: 'nulo' } as NullVal;
}
