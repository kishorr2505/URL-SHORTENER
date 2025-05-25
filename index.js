import { readFile } from 'fs/promises';
import http from 'http';
import path  from 'path';
import crypto from 'crypto';
import { writeFile } from 'fs/promises';

const DATA_FILE = path.join('DATA_FILE','links.json');
const loadLinks = async ()=>{
    try{
        const data = await readFile(DATA_FILE,'utf-8');
        return JSON.parse(data);
    }catch(error){
        if(error.code ==='ENOENT'){
            await writeFile(DATA_FILE,JSON.stringify({}));
            return {};
        }
        throw error;
    }
}

const serveFile = async (res,filePath,contentType)=>{
    try{
        const data = await readFile(filePath);
        res.writeHead(200,{'Content-Type':contentType});
        res.end(data);
    }catch{
        res.writeHead(404,{'Content-Type':contentType});
        res.end('404 Error, Page Not Found');
    }   
}
const savaLinks = async (links)=>{
    await writeFile(DATA_FILE, JSON.stringify(links));
};
const server = http.createServer(async (req,res)=>{
    if(req.method ==='GET'){
        if(req.url==='/'){
            return serveFile(res,path.join("public","index.html"),'text/html');
        }else if(req.url ==='/index.css'){
            return serveFile(res,path.join("public",'index.css'),'text/css')
        }else if(req.url === '/links'){
            const links = await loadLinks();
            res.writeHead(200,{'content-type':"application/json"});
            return res.end(JSON.stringify(links));
        }else{
            const links = await loadLinks();
            const shortCode = req.url.slice(1);
            
            if(links[shortCode]){
                res.writeHead(302,  {location:links[shortCode]});
                return res.end();
            }

            res.writeHead(404,{'content-type': "head/html"});
            res.end('Page not found')
        }
    }
   if(req.method==='POST' && req.url==='/shorten'){
        let body = "";    
        req.on('data',(chunks)=>{
            body+= chunks;
        })

        req.on('end',async ()=>{
            console.log(body);
            let parsed ;
            try{
                    parsed =  JSON.parse(body);
            }catch(err){
                res.writeHead(400, {'content-type':'text/plain'});  
                return res.end('Invalid JSON');
            }
            const {url, shortCode} = parsed;
            if(!url){
                res.writeHead(400,{'content-type':'text/plain'});
                return res.end('url is required');
            }
            const links = await loadLinks();
            const finalShortCode = shortCode || crypto.randomBytes(4).toString('hex');
            if(links[finalShortCode]){
                res.writeHead(400,{'content-type':'text/plain'});
                return res.end('ShortCode alrady exist');
            }

            links[finalShortCode] = url;
            await savaLinks(links);

            res.writeHead(200,{'content-type':'application/json'});
            res.end(JSON.stringify({success:true, shortCode:finalShortCode}))
        });
   }         
})

server.listen(3000,()=>{
    console.log("Running on http://localhost:3000")
})