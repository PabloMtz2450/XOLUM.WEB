const PROD_HOST="xolum.com.mx";
const PREVIEW_SUFFIX="--euphonious-crisp-9e0050.netlify.app";

function normalizedOrigin(url){
  const u=new URL(url);
  return `${u.protocol}//${u.host}`;
}

export function allowedAppOrigin(req){
  const u=new URL(req.url);
  const host=u.hostname.toLowerCase();

  if(host===PROD_HOST || host===`www.${PROD_HOST}`){
    return "https://xolum.com.mx";
  }

  // Netlify immutable deploy URLs for this exact project only.
  // Examples:
  // <deploy-id>--euphonious-crisp-9e0050.netlify.app
  if(host.endsWith(PREVIEW_SUFFIX)){
    const prefix=host.slice(0,-PREVIEW_SUFFIX.length);
    if(/^[a-z0-9-]{8,80}$/.test(prefix)){
      return `https://${host}`;
    }
  }

  // netlify dev localhost only
  if(host==="localhost" || host==="127.0.0.1"){
    return normalizedOrigin(req.url);
  }

  throw new Error("Origen XOLUM no autorizado");
}
