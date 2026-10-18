import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import sharp from "sharp";
import { openDatabase, type Database } from "../apps/api/src/db";
import { createApp } from "../apps/api/src/app";
import { defaultImage, imageSlots } from "../packages/contracts/src/site-images";

let db:Database,server:Server,base:string,cookie:string,csrf:string,photo:Buffer;
const origin="http://127.0.0.1:5174";
const draft=()=>({alt:"Synthetic test photo",caption:"Test only",name:"",role:"",focalX:40,focalY:30,isPlaceholder:false});
const write=(slot:string,body:unknown,method="PUT",headers:Record<string,string>={})=>fetch(`${base}/admin/site-images/${slot}`,{method,headers:{origin,cookie,"X-CSRF-Token":csrf,"Content-Type":"application/json",...headers},body:JSON.stringify(body)});
before(async()=>{
  db=await openDatabase("memory://");
  server=createApp(db,{origin,secret:"image-test-only",local:true}).listen(0,"127.0.0.1");
  await new Promise<void>(resolve=>server.once("listening",resolve));
  const address=server.address();assert.ok(address&&typeof address==="object");base=`http://127.0.0.1:${address.port}/api/v1`;
  const response=await fetch(`${base}/auth/local`,{method:"POST",headers:{origin}});
  cookie=response.headers.getSetCookie()[0].split(";")[0];csrf=(await response.json()).data.csrf;
  photo=await sharp({create:{width:2800,height:1400,channels:3,background:"#006647"}}).withExifMerge({IFD0:{Artist:"Synthetic private metadata"}}).jpeg().toBuffer();
});
after(async()=>{if(server)await new Promise<void>(resolve=>server.close(()=>resolve()));await db?.close();});
test("public defaults cover each placement and disclose generated placeholders",async()=>{
  const result=await (await fetch(`${base}/site-images`)).json();
  assert.equal(result.data.length,6);
  for(const image of result.data){assert.equal(image.isPlaceholder,true);assert.equal(image.uploaded,false);assert.ok(image.src.startsWith("/images/placeholders/"));assert.equal(image.version,0);}
  assert.equal((await fetch(`${base}/admin/site-images`)).status,401);
});
test("image writes require a session, correct origin and CSRF before parsing uploads",async()=>{
  assert.equal((await write("about-workplace",{},"PUT",{cookie:""})).status,401);
  assert.equal((await write("about-workplace",{},"PUT",{origin:"https://wrong.example"})).status,403);
  assert.equal((await write("about-workplace",{},"PUT",{"X-CSRF-Token":"wrong"})).status,403);
  assert.equal((await write("about-workplace",{},"DELETE",{"X-CSRF-Token":"wrong"})).status,403);
});
test("a built-in placeholder cannot silently become an authentic team photo",async()=>{
  assert.equal((await write("team-1",{...draft(),expectedVersion:0})).status,422);
  assert.equal((await db.query("SELECT slot FROM site_images")).rows.length,0);
});
test("invalid format, forged MIME, malformed data and unknown slots are rejected",async()=>{
  const payload={...draft(),expectedVersion:0};
  assert.equal((await write("unknown-slot",payload)).status,422);
  assert.equal((await write("about-workplace",{...payload,image:{type:"image/png",base64:photo.toString("base64")}})).status,422);
  assert.equal((await write("about-workplace",{...payload,image:{type:"image/png",base64:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>').toString("base64")}})).status,422);
  assert.equal((await write("about-workplace",{...payload,image:{type:"image/jpeg",base64:"not-base64"}})).status,422);
  assert.equal((await write("about-workplace",{...payload,focalX:101})).status,422);
});
test("valid upload is stored atomically, resized, stripped and publicly readable",async()=>{
  const response=await write("about-workplace",{...draft(),expectedVersion:0,image:{type:"image/jpeg",base64:photo.toString("base64")}});
  assert.equal(response.status,200);const saved=(await response.json()).data;
  assert.equal(saved.version,1);assert.equal(saved.uploaded,true);assert.equal(saved.isPlaceholder,false);assert.equal(saved.width,2400);assert.equal(saved.focalX,40);
  const file=await fetch(base.replace('/api/v1','')+saved.src);
  assert.equal(file.headers.get("content-type"),"image/webp");assert.equal(file.headers.get("x-content-type-options"),"nosniff");
  const metadata=await sharp(Buffer.from(await file.arrayBuffer())).metadata();assert.equal(metadata.format,"webp");assert.equal(metadata.width,2400);assert.equal(metadata.exif,undefined);
  const publicImages=(await (await fetch(`${base}/site-images`)).json()).data;
  assert.equal(publicImages[0].alt,draft().alt);assert.equal(publicImages[0].image_base64,undefined);
  assert.equal((await db.query("SELECT * FROM audit_events WHERE action='site_image_updated'")).rows.length,1);
});
test("metadata-only edits preserve bytes and stale versions cannot overwrite another edit",async()=>{
  const before=(await db.query<{image_base64:string}>("SELECT image_base64 FROM site_images WHERE slot='about-workplace'")).rows[0].image_base64;
  assert.equal((await write("about-workplace",{...draft(),caption:"Changed caption",expectedVersion:1})).status,200);
  assert.equal((await write("about-workplace",{...draft(),expectedVersion:1})).status,409);
  const after=(await db.query<{image_base64:string}>("SELECT image_base64 FROM site_images WHERE slot='about-workplace'")).rows[0].image_base64;
  assert.equal(before,after);
  const responses=await Promise.all([write("about-workplace",{...draft(),caption:"Editor A",expectedVersion:2}),write("about-workplace",{...draft(),caption:"Editor B",expectedVersion:2})]);
  assert.deepEqual(responses.map(response=>response.status).sort(),[200,409]);
});
test("reset restores the labelled default and prevents stale reset of a new image",async()=>{
  assert.equal((await write("about-workplace",{expectedVersion:2},"DELETE")).status,409);
  const response=await write("about-workplace",{expectedVersion:3},"DELETE");assert.equal(response.status,200);
  const image=(await response.json()).data;assert.equal(image.version,4);assert.equal(image.uploaded,false);assert.equal(image.isPlaceholder,true);assert.equal(image.alt,defaultImage("about-workplace").alt);
  assert.equal((await fetch(`${base}/site-images/about-workplace/file`)).status,404);
});
test("oversized and malformed image requests return safe errors",async()=>{
  const oversized=await write("team-2",{payload:"x".repeat(7*1024*1024)});assert.equal(oversized.status,413);
  const malformed=await fetch(`${base}/admin/site-images/team-2`,{method:"PUT",headers:{origin,cookie,"X-CSRF-Token":csrf,"Content-Type":"application/json"},body:"{"});assert.equal(malformed.status,400);
});
test("all fixed placements accept honest metadata and preserve row versions",async()=>{
  for(const slot of imageSlots.filter(item=>item.id!=="about-workplace")){
    const fallback=defaultImage(slot.id);
    const {alt,caption,name,role,focalX,focalY,isPlaceholder}=fallback;
    const response=await write(slot.id,{alt,caption,name,role,focalX,focalY,isPlaceholder,expectedVersion:0});
    // This uses a fresh staff session to avoid testing the write limiter here.
    if(response.status===429){const login=await fetch(`${base}/auth/local`,{method:"POST",headers:{origin}});cookie=login.headers.getSetCookie()[0].split(";")[0];csrf=(await login.json()).data.csrf;assert.equal((await write(slot.id,{alt,caption,name,role,focalX,focalY,isPlaceholder,expectedVersion:0})).status,200);}else assert.equal(response.status,200);
  }
});
