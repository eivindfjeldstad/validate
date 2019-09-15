interface Rule {
  type?: StringConstructor | NumberConstructor | NumberConstructor | Function;
  required?: boolean;
  length?: number | { min: number; max: number };
  size?: number | { min: number; max: number };
  enum?: string[];
  match?: RegExp;
  use?: {
    [key: string]: Function;
  };
  message?: {
    [key: string]: string;
  };
}

type SchemaType = {
  [key: string]:
    | Rule
    | Rule[]
    | SchemaType[]
    | StringConstructor
    | NumberConstructor
    | Function
    | FunctionConstructor;
};

export default class {
  constructor(target: SchemaType);
  validate(target: { [key: string]: any }):any;
}