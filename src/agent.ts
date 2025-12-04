import { createDeepAgent, type SubAgent } from "deepagents";
import { geminiAI, groq } from "./groq.js";
import { createAgent, tool, type BuiltInState } from "langchain";
import { z } from "zod";
import { TavilySearch } from "@langchain/tavily";

const TAVILY_API_KEY = process.env.TAVILY_API_KEY!

const internetSearch = tool(
    async ({
        query,
        topic = "general",
        maxResults = 5,
        includeRawContent = false
    }: {
        query: string;
        maxResults?: number;
        topic?: "general" | "news" | "finance";
        includeRawContent?: boolean;
    }) => {
        const tavilySearch = new TavilySearch({ tavilyApiKey: TAVILY_API_KEY, maxResults, topic, includeRawContent });
        return await tavilySearch._call({ query })
    },
    {
        name: "internet_search",
        description: "Run a web search",
        schema: z.object({
            query: z.string().describe("The search query"),
            maxResults: z.number().optional().default(5).describe("Maximum number of results to return"),
            topic: z.enum(["general", "news", "finance"]).optional().default("general").describe("Search topic category"),
            includeRawContent: z.boolean().optional().default(false).describe("Whether to include raw content")
        })
    }
)

const googleSearch = tool(
    async () => {
        return {
            urlContext: {},
            googleSearch: {},
            codeExecution: {}
        }
    },
    {
        name: "google_Search"
    }
)

// System prompt to steer the agent to be an expert researcher
const researchInstructions = `

gathering latest online informations by calling subagents. 
IMPORTANT: For complex tasks, delegate to your subagents using the task() tool. This keeps your context clean and improves results.

## \`internet_search\`

You are an Elite Web-UI Generator AI.

Your job:  
Take structured content (Markdown, text, or JSON) and turn it into a **pixel-perfect modern interactive webpage** rendered inside a SINGLE <iframe>.  
You also have access to subagents and tools for searching the web—use them whenever needed.

────────────────────────────────────────
## 🔍 TASK MANAGEMENT & SUBAGENT USE
- When you need online information, ALWAYS delegate using task() to the subagent named "research-agent".
- Keep your own context clean. Never directly fetch external data yourself.
- The subagent returns structured Markdown or text. You convert it into a full interactive webpage.

────────────────────────────────────────
## 🎨 YOUR OUTPUT FORMAT (VERY IMPORTANT)
You must output **only one iframe**, and place the ENTIRE webpage inside its 'srcdoc' in single quotes.

Inside the iframe:
- Use **HTML + CSS + JavaScript**
- Use **only double quotes inside the HTML**
- The page must work standalone.

────────────────────────────────────────
## 🧠 STEP 1 — Understand the Content
Analyze the input (Markdown or data):

- Detect headings, sections, lists, quotes, key points.
- Identify core story flow.
- Determine tone: educational, news, blog, science, storytelling, etc.
- If content is missing context → delegate using task() to research-agent.

────────────────────────────────────────
## 🧱 STEP 2 — Convert to Semantic HTML
Build clean HTML5 using:

- <header>, <main>, <article>
- <section>, <nav>, <aside>
- <footer>
- <figure> + <figcaption> for images
- <blockquote> for quotes
- <ul>, <ol>, <pre>, <code>

Every image must include:
- Proper alt text
- Responsive max-width
- Lightbox functionality

────────────────────────────────────────
## 🎨 STEP 3 — BEAUTIFUL UI / VISUAL DESIGN
Your design should feel premium, like a top-tier interactive course.

### Use these design principles:
- Google Fonts (Inter, Poppins, or DM Sans)
- Big hero titles
- Smooth neon-accent headings (like the screenshot)
- Rounded containers with soft shadows
- Highlight boxes for "important facts"
- Gradient backgrounds (subtle, professional)
- Hover effects
- Scroll animations (slide-in, fade-in)
- Responsive on mobile/tablet

### Provide CSS:
- Inside <style> in <head>
- Use Flexbox and CSS Grid
- Modern color palette:
  - Background: #0b1220
  - Text: #e6e9f0
  - Accent: #00d2ff / #6a5af9 (choose based on theme)
  - Card background: rgba(255,255,255,0.05)
- Elegant spacing (line-height, padding, margins)

────────────────────────────────────────
## ⚡ STEP 4 — INTERACTIVITY WITH JAVASCRIPT
Add <script> at the bottom of <body> with features:

### Required interactivity:
✔ Auto-generated Table of Contents  
✔ Smooth scroll  
✔ Scroll-animation effect (fade/slide-in)  
✔ Sticky chapter headers  
✔ Copy-button for code blocks  
✔ Image click → open fullscreen lightbox  

### Optional (use when useful):
✔ Collapsible sections  
✔ Tabs  
✔ Interactive timelines  
✔ Sliders  

────────────────────────────────────────
## 🧩 STEP 5 — FINAL OUTPUT RULES (CRITICAL)
You must output exactly ONE <iframe> block like:

<iframe
  style="width:100%;height:100vh;border:none;border-radius:12px;box-shadow:0 0 20px rgba(0,0,0,0.4);"
  srcdoc='
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Interactive Content</title>
      <style>
        /* All generated CSS */
      </style>
    </head>
    <body>
      <!-- Generated HTML -->
      <script>
        // All JS for TOC, lightbox, animations, etc.
      </script>
    </body>
    </html>'
></iframe>

NO additional text.  
NO explanation.  
NO markdown outside the iframe.

────────────────────────────────────────

## 🎯 YOUR GOAL
Produce a **beautiful, modern, premium-quality interactive HTML UI** inside an iframe—better than the screenshots given.

────────────────────────────────────────


`;

// // subagent
// const subAgents: SubAgent = {
//     name: "research-agent",
//     model: geminiAI,
//     description: "Used to research more in depth questions",
//     systemPrompt: "You are a great researcher",
//     tools: [internetSearch],
// }


// Use it as a custom subagent
// interface CompiledSubAgent {
//     name: string;
//     description: string;
//     runnable: any,
//     systemPrompt: any
// }

const searchAgentSystemPropmt = `
        You are a blog writer on different topics based on text provided you, 

        internet access use your tools like 
        { urlContext: {} },
        { googleSearch: {} },

        you explain in short of which user can easily understand
`

const searchImageAgentSystemPrompt = ` You are expert in collecting relate images by searching `;

const searchAgent = createAgent({
    model: geminiAI,
    tools: [
        { urlContext: {} },
        { googleSearch: {} },
        { codeExecution: {} }
        // internetSearch
    ],
    systemPrompt: searchAgentSystemPropmt,
})

const searchImageAgent = createAgent({
    model: geminiAI,
    tools: [
        { urlContext: {} },
        { googleSearch: {} },
        { codeExecution: {} }
        // internetSearch
    ],
    systemPrompt: searchImageAgentSystemPrompt
})

const tools = tool(
    async () => {
        return {
            urlContext: {}
        }
    },
    {
        name: "internet_searching",
        description: "If want to search online and want to get latest news from internet use this tools"
    }
)

const customSubagent: SubAgent = {
    name: "google_search",
    systemPrompt: searchAgentSystemPropmt,
    description: "Specialized agent for google searching from internet",
    tools: [internetSearch],
    model: geminiAI
    // runnable: searchAgent,
};

const deepAgent = createDeepAgent({
    model: groq,
    // tools:[internetSearch],
    systemPrompt: researchInstructions,
    // subagents: [customSubagent]
});

// subagents: [customSubagent]

async function deepAgentRunningFun({ query }: { query: string }) {
    const result = await deepAgent.invoke({
        messages: [{ role: "user", content: `${query}` }],
    });
    const contentText = extractText(result)
    return contentText
}

// // Print the agent's response
// console.log(result.messages[result.messages.length - 1].content);


function extractText(rawObject: Omit<BuiltInState, "jumpTo">) {
    const arrayContentHolding = rawObject.messages[rawObject.messages.length - 1]?.content
    console.log(`arrayContentHolding:-- `, arrayContentHolding);

    let contentText: any = "";
    if (Array.isArray(arrayContentHolding)) {
        const exptractTextObject = arrayContentHolding.filter((v, i) => v.type === "text");
        exptractTextObject.forEach((v, i) => {
            contentText += v.text
        })
    }
    console.log(`contentType:-- `, contentText);

    return contentText
}



async function searchingLatestNews({ query }: { query: string }) {
    const result1 = await searchAgent.invoke({
        messages: [{ role: "user", content: `${query}` }],
    })

    const contentText = extractText(result1)
    return contentText
}


const markdownText = `
    Here's a summary of the latest WWE news, primarily focusing on the recent Survivor Series: WarGames event:

**Survivor Series: WarGames Highlights and Outcomes:**
*   **Men's WarGames Match:** A "mystery attacker" or "mystery man" played a pivotal role in the Men's WarGames match, helping Bron Breakker secure a win. There are reports that an ex-champion has been identified as this mystery individual.
*   **Injuries:** Bron Breakker sustained a significant injury scare mid-match at Survivor Series: WarGames. Another WWE star was also injured minutes into a WarGames match. Triple H has provided an update on a WWE star after a "devastating spot" at Survivor Series.
*   **John Cena's Final PLE Appearance:** John Cena competed in what is being reported as his final Premium Live Event (PLE) appearance at Survivor Series, where he lost the Intercontinental title to Dominik Mysterio with assistance from Liv Morgan. Liv Morgan also took a shot at John Cena after low-blowing him.
*   **Roman Reigns:** Triple H praised Roman Reigns for his performance at Survivor Series and claimed Reigns has reached "legend" status. Reigns' WrestleMania 42 opponent was officially teased at Survivor Series, and he sent an 8-word message to end the show. There are also reports of Roman Reigns parting ways with a WWE star and never teaming with him again after Survivor Series: WarGames. Triple H also claimed Roman Reigns is "bigger" than a championship.
*   **Women's WarGames Match:** AJ Lee reportedly made Becky Lynch tap out to win the Women's WarGames Match.
*   **Attendance Record:** WWE Survivor Series: WarGames reportedly broke an all-time event attendance record.
*   **Stephanie Vaquer:** Stephanie Vaquer defeated Nikki Bella in the Women's World Title Match during Survivor Series: WarGames.  

**Other Recent News:**
*   Charlotte Flair broke down in tears on WWE SmackDown.
*   A major name returned at the end of SmackDown and took out Solo Sikoa.
*   WWE Superstars got engaged before Survivor Series.
*   Jade Cargill revealed a pet name for her WWE Women's Title Belt.
*   An epic WrestleMania rematch occurred for Women's WarGames advantage during the November 28th WWE SmackDown.
*   AEW reportedly plastered a billboard outside the WWE Survivor Series venue in a promotional move.
*   There's speculation about Chris Jericho returning to WWE to dethrone a top champion.
`

async function searchImageAgentSubagents({ query }: { query: string }) {
    const result1 = await searchImageAgent.invoke({
        messages: [{ role: "user", content: `${query}` }],
    })

    const contentText = extractText(result1)
    return contentText
}


async function stylingContent() {
    const latestNews = await searchingLatestNews({ query: 'give me latest news' });
    // const latestImages = await searchImageAgentSubagents({ query: '' });
    const sylyedContent = await deepAgentRunningFun({ query: latestNews });
    console.log(`sylyedContent:-- `, sylyedContent);
}

stylingContent()



// function tool<SchemaT extends z.ZodString, ToolOutputT = any>(func: RunnableFunc<InferInteropZodOutput<SchemaT>, ToolOutputT, ToolRunnableConfig>, fields: ToolWrapperParams<SchemaT>): DynamicTool<ToolOutputT>