// Validator for the JSON Schema keywords used by schemas/lesson.schema.json.
// Not a general purpose implementation of every Draft 2020-12 keyword.
export function validateSchema(value,schema,at='$'){
 const fail=m=>{throw Error(`${at}: ${m}`);};
 const type=Array.isArray(value)?'array':value===null?'null':typeof value;
 if(schema.type==='integer'){if(!Number.isInteger(value))fail('expected integer');}
 else if(schema.type&&schema.type!==type)fail(`expected ${schema.type}`);
 if(type==='object'){
  for(const key of schema.required||[])if(!Object.hasOwn(value,key))fail(`missing ${key}`);
  for(const [key,v] of Object.entries(value)){const child=schema.properties?.[key];if(child)validateSchema(v,child,at+'.'+key);else if(schema.additionalProperties===false)fail(`unknown property ${key}`);}
 }
 if(type==='array'){
  if(schema.minItems!==undefined&&value.length<schema.minItems||schema.maxItems!==undefined&&value.length>schema.maxItems)fail('array length');
  if(schema.uniqueItems&&new Set(value.map(v=>JSON.stringify(v))).size!==value.length)fail('duplicate items');
  if(schema.items)value.forEach((v,i)=>validateSchema(v,schema.items,`${at}[${i}]`));
 }
 if(type==='string'){
  if(schema.minLength!==undefined&&value.length<schema.minLength||schema.maxLength!==undefined&&value.length>schema.maxLength)fail('string length');
  if(schema.pattern&&!new RegExp(schema.pattern).test(value))fail('pattern mismatch');
  if(schema.format==='date'&&(!/^\d{4}-\d{2}-\d{2}$/.test(value)||isNaN(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value))fail('invalid date');
 }
 if(type==='number'){
  if(!Number.isFinite(value)||schema.minimum!==undefined&&value<schema.minimum||schema.maximum!==undefined&&value>schema.maximum||schema.exclusiveMinimum!==undefined&&value<=schema.exclusiveMinimum)fail('numeric range');
 }
 return true;
}
