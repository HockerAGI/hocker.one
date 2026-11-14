import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import {
  parseMcpParamAnnotations,
  mcpParamHeaders,
  encodeMcpHttpHeaderValue,
} from "../src/lib/mcp/mcp-http-param-headers.ts";

const annotatedSchema = {
  type: "object",
  properties: {
    owner: { type: "string", "x-mcp-header": "Owner" },
    repo: { type: "string", "x-mcp-header": "Repo" },
    perPage: { type: "integer" },
    fields: { type: "array", items: { type: "string" } },
  },
  required: ["owner","repo"],
};

test("MCP 2026-07-28 tool header annotations mirror exactly the annotated arguments", () => {
  const annotations = parseMcpParamAnnotations(annotatedSchema);
  assert.deepEqual(annotations.map(x=>({name:x.name,path:x.path})), [
    {name:"Owner",path:["owner"]},{name:"Repo",path:["repo"]},
  ]);
  assert.deepEqual(mcpParamHeaders(annotations,{
    owner:"HockerAGI",repo:"hocker.one",perPage:1,fields:["sha"],
  }),{"Mcp-Param-Owner":"HockerAGI","Mcp-Param-Repo":"hocker.one"});
  assert.deepEqual(mcpParamHeaders(annotations,{owner:"HockerAGI"}),{"Mcp-Param-Owner":"HockerAGI"});
});

test("MCP parameter headers encode non-ASCII, whitespace and sentinel safely", () => {
  assert.equal(encodeMcpHttpHeaderValue("foo"),"foo");
  assert.equal(encodeMcpHttpHeaderValue("a\nb"),"=?base64?YQpi?=");
  assert.equal(encodeMcpHttpHeaderValue(" Méx"),"=?base64?IE3DqXg?=");
  assert.equal(encodeMcpHttpHeaderValue("=?base64?literal?="),"=?base64?PT9iYXNlNjQ/bGl0ZXJhbD89?=");
  assert.throws(()=>mcpParamHeaders(parseMcpParamAnnotations(annotatedSchema),{owner:2,repo:"hocker.one"}),/MCP_TOOL_HEADER_TYPE_MISMATCH/);
});

test("MCP malformed x-mcp-header definitions fail closed",()=>{
  assert.throws(()=>parseMcpParamAnnotations({properties:{bad:{type:"array","x-mcp-header":"Bad"}}}),/MCP_INVALID_TOOL_HEADER_ANNOTATION/);
  assert.throws(()=>parseMcpParamAnnotations({properties:{bad:{type:"string","x-mcp-header":"Bad\nInjection"}}}),/MCP_INVALID_TOOL_HEADER_ANNOTATION/);
  assert.throws(()=>parseMcpParamAnnotations({properties:{one:{type:"string","x-mcp-header":"OWNER"},two:{type:"string","x-mcp-header":"Owner"}}}),/MCP_INVALID_TOOL_HEADER_ANNOTATION/);
  assert.throws(()=>parseMcpParamAnnotations({properties:{bad:{type:"object",items:{type:"string","x-mcp-header":"Hidden"}}}}),/MCP_INVALID_TOOL_HEADER_ANNOTATION/);
});

test("Authenticated read-only GitHub MCP wire request includes required annotated headers",()=>{
  const code = [
    "import {McpClient} from './src/lib/mcp/mcp-client.ts';",
    "let called=0; let accepted=[];",
    "globalThis.fetch=async (url,init)=>{",
    " const body=JSON.parse(init.body); const headers=new Headers(init.headers);",
    " let result;",
    " if(body.method==='server/discover') result={capabilities:{tools:{}},serverInfo:{version:'2026-07-28'}};",
    " else if(body.method==='tools/list') result={tools:[{name:'list_commits',inputSchema:{type:'object',required:['owner','repo'],properties:{owner:{type:'string','x-mcp-header':'Owner'},repo:{type:'string','x-mcp-header':'Repo'},sha:{type:'string'},perPage:{type:'integer'},fields:{type:'array',items:{type:'string'}}}}}]};",
    " else if(body.method==='tools/call'){",
    "  called++; const args=body.params.arguments;",
    "  const valid=headers.get('Mcp-Param-Owner')===args.owner && headers.get('Mcp-Param-Repo')===args.repo &&",
    "   headers.get('Mcp-Method')==='tools/call' && headers.get('Mcp-Name')==='list_commits' &&",
    "   headers.get('MCP-Protocol-Version')==='2026-07-28';",
    "  accepted.push({valid,keys:[...headers.keys()].filter(k=>k.startsWith('mcp-param-')),argKeys:Object.keys(args)});",
    "  if(!valid) return new Response(JSON.stringify({error:'HeaderMismatch'}),{status:400});",
    "  result={content:[{type:'text',text:'real-in-fixture'}]};",
    " } else throw Error('unexpected method '+body.method);",
    " return new Response(JSON.stringify({jsonrpc:'2.0',id:body.id,result}),{headers:{'Content-Type':'application/json'}});",
    "};",
    "const c=new McpClient({id:'github',name:'test',type:'github',url:'https://api.githubcopilot.com/mcp/readonly',enabled:true});",
    "await c.initialize(); const tools=await c.listTools(); await c.callTool('list_commits',{owner:'HockerAGI',repo:'hocker.one',sha:'main',perPage:1,fields:['sha']});",
    "console.log(JSON.stringify({called,accepted,tools:tools.map(x=>x.name)}));"
  ].join("\n");
  const run = spawnSync(process.execPath,["--experimental-strip-types","--input-type=module","--eval",code],{
    cwd:new URL("../",import.meta.url),encoding:"utf8",timeout:10000,
  });
  assert.equal(run.status,0,run.stderr);
  const data=JSON.parse(run.stdout.trim());
  assert.equal(data.called,1);
  assert.deepEqual(data.tools,["list_commits"]);
  assert.equal(data.accepted[0].valid,true);
  assert.deepEqual(data.accepted[0].keys,["mcp-param-owner","mcp-param-repo"]);
  assert.deepEqual(data.accepted[0].argKeys,["owner","repo","sha","perPage","fields"]);
});
