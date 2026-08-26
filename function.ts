import { ArgumentExpr, Body, ReturnExpr, Stmt } from "./ast.ts";
import Environment from "./environment.ts";
import { evaluate } from "./interpreter.ts";
import { MK_NULL, NumberVal, RealVal, RuntimeVal, ValueType } from "./values.ts";
import { reportError } from "./main.ts";
import { Callable } from "./callable.ts";

export class Function implements Callable {
    public body: Body;
    public args: ArgumentExpr[];
    public type: ValueType = "NullVal";

    constructor(body: Body, args: ArgumentExpr[], type?:ValueType) {
        this.body = body;
        this.args = args;
        this.type = type? type : "NullVal";
    }

    public call(args: RuntimeVal[], env: Environment):RuntimeVal {
        let lastRes = {} as RuntimeVal;
        lastRes = evaluate(this.body, env);
        if (lastRes.type=='ReturnVal') {
            return lastRes.value;
        }
        return MK_NULL();
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