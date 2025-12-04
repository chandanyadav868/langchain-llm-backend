interface MessageInterFace{
  role:"user" | "assistant",
  content:string
}

interface BodyData {
  messages:MessageInterFace[],
  stream:boolean;
  model:string;
  type:"Gemina" | "Groq"
}