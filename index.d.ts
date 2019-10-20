type Type = Function | string

interface PropertyDefinition {
  type?: Type;
  required?: boolean;
  length?: number | { min?: number; max?: number };
  size?: number | { min?: number; max?: number };
  enum?: string[];
  each?: Rule;
  elements?: Rule[];
  match?: RegExp;
  use?: { [key: string]: ValidationFunction };
  message?: string | MessageFunction | { [key: string]: string | MessageFunction };
  schema?: Schema;
  properties?: SchemaDefinition;
}

type Rule = Type
  | PropertyDefinition
  | SchemaDefinition
  | Schema
  | RuleArray

// Remove when ts 3.7 is released
interface RuleArray extends Array<Rule> {}

interface SchemaDefinition {
  [key: string]: Rule
}

interface ValidationFunction {
  (value: any, ctx: object, ...args: any): boolean;
}

interface TypecastFunction {
  (value: any): unknown;
}

interface MessageFunction {
  (path: string, ctx: object, ...args: any): string;
}

interface ValidationOptions {
  typecast?: boolean;
  strip?: boolean;
  strict?: boolean;
}

export class ValidationError {
  constructor(message: string, path: string);
  path: string;
  status: number;
  expose: boolean;
}

export default class Schema {
  constructor(definition?: SchemaDefinition, options?: ValidationOptions);
  path(path: string, rules?: Rule): Property;
  assert(target: { [key: string]: any }, options?: ValidationOptions): void;
  validate(target: { [key: string]: any }, options?: ValidationOptions): ValidationError[];
  message(validator: string, message: string | MessageFunction): Schema;
  message(messages: { [validator: string]: string | MessageFunction }): Schema;
  validator(name: string, fn: ValidationFunction): Schema;
  validator(validators: { [name: string]: ValidationFunction }): Schema;
  typecaster(name: string, fn: TypecastFunction): Schema;
  typecaster(typecasters: { [name: string]: TypecastFunction }): Schema;
}

declare class Property {
  constructor(name: string, schema: Schema);
  message(messages: (string | MessageFunction) | { [validator: string]: string | MessageFunction }): Property;
  schema(schema: Schema): Property;
  use(fns: { [name: string]: ValidationFunction }): Property;
  required(bool?: boolean): Property;
  type(type: Type): Property;
  string(): Property;
  number(): Property;
  array(): Property;
  date(): Property;
  length(rule: number | { min?: number; max?: number }): Property;
  size(rule: number | { min?: number; max?: number }): Property;
  enum(enums: string[]): Property;
  match(regexp: RegExp): Property;
  each(rules: Rule): Property;
  elements(arr: Rule[]): Property;
  properties(props: SchemaDefinition): Property; 
  path(path: string, rules?: Rule): Schema;
  typecast<T>(value: any): T;
  validate(value: any, ctx: object, path: string): ValidationError | null;
}