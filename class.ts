import { ArgumentExpr, ReturnExpr, Stmt } from "./ast.ts";
import Environment from "./environment.ts";
import { evaluate } from "./interpreter.ts";
import { MK_NULL, NumberVal, RealVal, RuntimeVal, ValueType } from "./values.ts";
import { reportError } from "./main.ts";

export class Class {
    public body: Stmt[];
    public parent?: Class;

    constructor(body: Stmt[], parent?: Class) {
        this.body = body;
        this.parent = parent;
    }
}