import {clearCookieHeaders} from "./_auth.mjs";
import {allowedAppOrigin} from "./_origin.mjs";

export default async(req)=>{
  try{
    const site=allowedAppOrigin(req);
    const domain=process.env.AUTH0_DOMAIN;
    const client=process.env.AUTH0_CLIENT_ID;
    const loc=domain&&client
      ? `https://${domain}/v2/logout?client_id=${encodeURIComponent(client)}&returnTo=${encodeURIComponent(site)}`
      : site;
    const h=new Headers({location:loc,"cache-control":"no-store"});
    for(const x of clearCookieHeaders())h.append("set-cookie",x);
    return new Response(null,{status:302,headers:h});
  }catch(e){
    const h=new Headers({"cache-control":"no-store","content-type":"text/plain; charset=utf-8"});
    for(const x of clearCookieHeaders())h.append("set-cookie",x);
    return new Response(`Cierre de sesión rechazado: ${e.message}`,{status:400,headers:h});
  }
};

export const config={
  path:"/auth/logout",
  rateLimit:{windowLimit:30,windowSize:60,aggregateBy:["ip","domain"]}
};
