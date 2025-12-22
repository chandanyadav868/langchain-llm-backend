import fs from "fs";
import path from "path";
import Groq from 'groq-sdk';

type Voices = "Arista-PlayAI" | "Atlas-PlayAI" | "Basil-PlayAI" | "Briggs-PlayAI" | "Calum-PlayAI" | "Celeste-PlayAI" | "Cheyenne-PlayAI" | "Chip-PlayAI" | "Cillian-PlayAI" | "Deedee-PlayAI" | "Fritz-PlayAI" | "Gail-PlayAI" | "Indigo-PlayAI" | "Mamaw-PlayAI" | "Mason-PlayAI" | "Mikail-PlayAI" | "Mitch-PlayAI" | "Quinn-PlayAI" | "Thunder-PlayAI"

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

interface GroqTextToSpeachProp {
    savingAudioPath?: string
    model: string
    voice: Voices
    text: string
    responseFormat: "wav"
}


async function GroqTextToSpeach(options: GroqTextToSpeachProp, savingAudioPath: string) {
    const response = await groq.audio.speech.create({
        model: options.model,
        voice: options.voice,
        input: options.text,
        response_format: options.responseFormat
    });

    /* this arrayBuffer 
    represent the unit8Array does not able to write in node.js environtment so we convert it intot he node.js environment so we are usng Buffer
    ArrayBuffer { [Uint8Contents]: <52 49 46 46 ff ff ff ff 57 41 56 45 66 6d 74 20 10 00 00 00 01 00 01 00 80 bb 00 00 00 77 01 00 02 00 10 00 4c 49 53 54 1a 00 00 00 49 4e 46 4f 49 53 46 54 0d 00 00 00 4c 61 76 66 36 31 2e 37 2e 31 30 30 00 00 64 61 74 61 ff ff ff ff 06 00 06 00 06 00 06 00 06 00 06 00 06 00 00 00 06 00 06 00 06 00 ... 297580 more bytes>,byteLength: 297680 } */

    const arrayBuffer = await response.arrayBuffer();

    /* console.log(`This is the arrayBuffer represent the raw bytes of audio`, arrayBuffer);

    this unit8Array comptible towards the node.js this represent same things but node.js compatible
    <Buffer 52 49 46 46 ff ff ff ff 57 41 56 45 66 6d 74 20 10 00 00 00 01 00 01 00 80 bb 00 00 00 77 01 00 02 00 10 00 4c 49 53 54 1a 00 00 00 49 4e 46 4f 49 53 ... 297630 more bytes> */

    /* Because Node’s fs APIs require: Buffer | Uint8Array | string
    or you can use below code also
    const arr = new Uint8Array(await response.arrayBuffer()); */

    const buffer = Buffer.from(arrayBuffer);

    /* console.log(`This is the node.js converted bytes of unit8Buffer which are compatible for writting in node.js `, buffer); */

    await fs.promises.writeFile(savingAudioPath, buffer);
}

GroqTextToSpeach({
    model: "playai-tts",
    voice: "Fritz-PlayAI",
    text: `Latest News – India vs South Africa (T20 I series, 2025)**

| Item | Details |
|------|---------|
| **Series** | 3‑match T20 I series (South Africa tour of India) |
| **Current score** | Series tied 1‑1 (each side has won one match; the first two games were split – India won the opener in Cuttack, South Africa took the second in Mullanpur) |
| **Upcoming match** | **3rd T20I** – the decider |
| **Date & Time** | **Sunday, 14 December 2025**, 7:00 PM IST |
| **Venue** | Himachal Pradesh Cricket Association Stadium, Dharamshala (HPCA) |      
| **Broadcast / Live‑stream** | • JioStar Network TV channels  <br>• Jio Hotstar app & website (live streaming) |
| **Recent headlines** | • “Series finely poised at 1‑1 after two contrasting encounters.”  <br>• “India made a dominant start with a commanding win in the opening match; South Africa bounced back with a strong chase in the second.” |
| **Key player notes** | • **India** – Shubman Gill (vice‑captain) is under the spotlight after a golden‑duck in the second game; Suryakumar Yadav leads the batting line‑up.`,
    responseFormat: "wav",
}, "speech.wav");


import { GoogleGenAI } from '@google/genai';
import wav from 'wav';

const geminiGenAi = new GoogleGenAI({
    apiKey: process.env.GEMINA_API_KEY!
})



const audioGenerate = async () => {

    const transcript = await geminiGenAi.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: "Generate a short transcript around 100 words that reads like it was clipped from a podcast by excited herpetologists. The hosts names are Dr. Joe and Jane.",
        config: {
            responseSchema: {

            }
        }
    })

    console.log(`transcript:- `, transcript.text);


    //     console.log("Generating Audio from this");
    //     const response = await geminiGenAi.models.generateContent({
    //         model: "gemini-2.5-flash-preview-tts",
    //         contents: [{ parts: [{ text: `**(Sound of enthusiastic chirping and a faint rustling)**

    // **Dr. Joe:** And Jane, you are *not* going to believe what we found near the old creek bed this morning! Absolutely incredible!

    // **Jane:** (Breathless) Oh, I have a feeling, Joe! Was it…? Was it what I think it was? The elusive…

    // **Dr. Joe:** The *Eumeces elegans*! The Emerald Skink! We spotted a juvenile, perfectly camouflaged, practically shimmering! I nearly fainted!

    // **Jane:** No way! The coloration on those things is legendary! Did you get any good shots? This is going to blow the listeners' minds! This podcast is going to need a dedicated episode just for this!

    // **Dr. Joe:** Absolutely! Stay tuned for more details, folks, right after this short break!` }] }],
    //         config: {
    //             systemInstruction:`
    //                 Make Speaker1 sound tired and bored, and Speaker2 sound excited and happy:
    //             `,
    //             responseModalities: ['AUDIO'],
    //             speechConfig: {
    //                 multiSpeakerVoiceConfig:{
    //                     speakerVoiceConfigs:[
    //                         {
    //                            speaker: 'Joe',
    //                            voiceConfig: {
    //                               prebuiltVoiceConfig: { voiceName: 'Kore' }
    //                            }
    //                         },
    //                         {
    //                            speaker: 'Jane',
    //                            voiceConfig: {
    //                               prebuiltVoiceConfig: { voiceName: 'Puck' }
    //                            }
    //                         }
    //                     ]
    //                 }
    //             },
    //         },
    //     });

    //     console.log("audioGenerate", response);

    // const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    //     // console.log("Data:- ", data);

    // const audioBuffer = Buffer.from(data!, "base64");
    //     console.log("audioBuffer", audioBuffer);

    // we are using wav library with google because it give us a raw PCM audio which needs to be converted Because the API returns PCM, and PCM alone cannot be played. wav.FileWriter turns PCM → proper .wav file.

    //     const fileName = 'out.wav';
    // saveWaveFile(fileName, audioBuffer)

}


async function saveWaveFile(
    filename: string,
    pcmData: any,
    channels: number = 1,
    rate: number = 24000,
    sampleWidth: number = 2,
) {
    return new Promise((res, rej) => {
        const writer = new wav.FileWriter(filename, {
            channels,
            sampleRate: rate,
            bitDepth: sampleWidth * 8,
        });

        writer.on('finish', res);
        writer.on('error', rej);
        writer.write(pcmData);
        writer.end();
    })
}

// await audioGenerate()