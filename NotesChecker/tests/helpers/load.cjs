const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript')
module.exports=function makeLoader(overrides={}) {
 const cache=new Map()
 function load(file) {
  file=path.resolve(file)
  if(file.endsWith('.json')) return JSON.parse(fs.readFileSync(file,'utf8'))
  if(cache.has(file))return cache.get(file).exports
  const mod={exports:{}};cache.set(file,mod)
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText
  const localRequire=id=>{
   if(!id.startsWith('.')&&!id.startsWith('@/'))return require(id)
   const base=id.startsWith('@/')?path.resolve(id.slice(2)):path.resolve(path.dirname(file),id)
   const target=['','.ts','.tsx'].map(ext=>base+ext).find(f=>fs.existsSync(f)&&fs.statSync(f).isFile())
   if(!target)throw Error('Cannot resolve '+id)
   return load(target)
  }
  vm.runInNewContext(code,{exports:mod.exports,module:mod,require:localRequire,process:{env:{CHECKER_PROVIDER:'gemini',GEMINI_API_KEY:'synthetic-test-key',GEMINI_MODEL:'mock'}},Error,Buffer,Request,Response,URL,AbortSignal,...overrides},{filename:file})
  return mod.exports
 }
 return load
}
