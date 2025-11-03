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

    

    private returnReal(val:RuntimeVal):RuntimeVal {
        if(val.type=="NumberVal") {
            return (val as RealVal);
        }
        return MK_NULL();
    }
    
    private returnNumber(val:RealVal):NumberVal {
        val.value=Math.floor(val.value);
        let result = (val as unknown);
        return result = (result as NumberVal);
    }
}