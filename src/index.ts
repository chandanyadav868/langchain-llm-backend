import express,{type Response} from 'express';
import cors from 'cors'
const app = express();
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { auth } from './auth.js';
import "dotenv/config";

const port = process.env.PORT || 3000;
console.log(port);


app.use(cors({
  origin: "*",
  credentials: true
}))

app.all("/api/auth/*slate", toNodeHandler(auth));

app.use(express.json());

// checking
app.get("/health-check",(req,res)=>{
  res.status(200).json({status:200,message:"Successfully running backend"})
})


app.get("/api/me", async (req, res) => {
  console.log('Request:-- ', req.headers, '\n', fromNodeHeaders(req.headers));

  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  console.log(`sessionL-- `, session);

  return res.json(session);
});


const map = new Map()

// server sent event
app.get('/events', (req, res) => {

  const {browser} = req.query;
  console.log(`Request borwser:-- ======== `, '\n', browser);
  map.set(browser,res);
  
  
  // required for SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // optional Cors
  res.setHeader('Access-Control-Allow-Origin', "*");
  
  // If client sent Last-Event-ID, we may resume from that id 
  const lastEventId = req.header('LAST-EVENT-ID');
  // console.log(`Browser Data: `, map.get("chrome"));
  const otherBrowserClient = map.get("chrome")

  res.write(': connected\n\n');

  let counter = 0;
  let interval:string | NodeJS.Timeout = ""

  if (browser === "chrome") {
    // console.log("Your browser is not able to recive data");
     interval = setInterval(() => {
      const payload = {
        name: "Chandan",
        time: new Date().toISOString(),
        count: counter,
        browser
      };
  
      // console.log("Sending SSE event:", payload);
  
      otherBrowserClient.write(`id: ${counter}\n`);
      otherBrowserClient.write(`event: myOwn\n`);
      otherBrowserClient.write(`data: ${JSON.stringify(payload)} \n\n`);
  
      counter++;
  
      if (counter > 200) {
        otherBrowserClient.write(`event: end\n`)
        otherBrowserClient.write(`data: end`)
        // res.end() // this stop the backend so event reconnect, do not use this
        clearInterval(interval)
      }
    }, 2000);
  }else{
     interval = setInterval(() => {
      const payload = {
        name: "Chandan",
        time: new Date().toISOString(),
        count: counter,
        browser
      };
  
      // console.log("Sending SSE event:", payload);
  
      otherBrowserClient.write(`id: ${counter}\n`);
      otherBrowserClient.write(`event: tick\n`);
      otherBrowserClient.write(`data: ${JSON.stringify(payload)} \n\n`);
  
      counter++;
  
      if (counter > 100) {
        otherBrowserClient.write(`event: end\n`)
        otherBrowserClient.write(`data: end`)
        // res.end() // this stop the backend so event reconnect, do not use this
        clearInterval(interval)
      }
    }, 2000);
  }


  req.on('close', () => {
    console.log(`❌ Client disconnected`);
    clearInterval(interval)
  })

})


// for SSE react Native

app.get("/react-native-sse",(req,res)=>{
  console.log(req);
  
  // required for SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // optional Cors
  res.setHeader('Access-Control-Allow-Origin', "*");

  res.write("connected \n\n")

  
  let count = 0
  const internal = setInterval(()=>{
    res.write("id: messages1 \n\n")
    res.write("event: messages \n\n");
    res.write(`data: hello World ${count} \n\n`)
    count ++
    
    if (count > 10) {
      console.log("clearing Interloop");
      res.write("data: DONE \n\n");

      clearInterval(internal)
    }
  },1000)

})



app.get("/react-native", (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Transfer-Encoding", "chunked");
  console.log("req ", req.headers);
  
  let count = 0;
  const interval = setInterval(() => {
    res.write(`chunk ${count}\n`);
    count++;

    if (count > 10) {
      res.end("DONE");
      clearInterval(interval);
    }
  }, 1000);
});

app.listen(port, () => {
  console.log("Server running on:", port);
});