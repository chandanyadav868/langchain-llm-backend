import fs from "fs";
import ytdl from "youtube-dl-exec"
import path from "path";
const url = "https://www.youtube.com/watch?v=eIoohUmYpGI";
let directory = path.join(process.cwd(), "ytSubtitles");

// console.log(process.cwd(),path.relative("ytsubtitles.js","ytSubtitles"),process.execPath,path.resolve("craLinkHakathon","backend","src","ytsubtitles"));

export const twitterVideoUrl = async (url:string) => {
   try {
     console.log(`twitterVideoUrl:-- `,{url});
     
     const ytdlUrl = await ytdl.exec(url, {
         skipDownload: true,
         // dumpJson:true
         writeAutoSub: true,
         // dumpSingleJson:true
     }, {
         cwd: directory,
     });
     console.log(`Title #----> <-----#`, ytdlUrl);
 
 
     const arrayFiles = fs.readdirSync(directory, { encoding: "utf-8" });
     console.log(`ArrayFilesSubtitle:-- `,arrayFiles);
     
     let ytid = url.match(/(?:v=)([^&]+)/)?.[1];
 
     if (!ytid) return;
 
     const filesExtractedCleanUp = arrayFiles.find((v, i) => v.includes(ytid));
 
     if (!filesExtractedCleanUp) {
         console.log("File not found");
         return;
     }
 
     const cleanData = cleanTranscript(`${directory}/${filesExtractedCleanUp}`);
 
     // let title = ytdlUrl?.title.replace(/\, /g, "_").replace(/[ ]/g, "_").replace(/_\|_/g, "_");
     fileSaving(`${directory}/${ytid}`, cleanData, `${directory}/${filesExtractedCleanUp}`);
 
     return cleanData
   } catch (error) {
    console.log(`Error in TwitterVideoUrl:-- `, error);
    return JSON.stringify(error)
   }

}

// await twitterVideoUrl(url);


// cleanTranscript
export function cleanTranscript(file:string) {
    console.log("filePath:--", file);

    let text = fs.readFileSync(file, "utf8");

    text = text
        .replace(/^WEBVTT.*\n/gm, "")
        .replace(/^Kind:.*\n/gm, "")
        .replace(/^Language:.*\n/gm, "")
        .replace(/\d{2}:\d{2}:\d{2}\.\d{3} -->.*\n/g, "")
        .replace(/<[^>]+>/g, "");

    let lines = text
        .split("\n")
        .map(l => l.trim())
        .filter(Boolean);

    const unique = [];
    for (let i = 0; i < lines.length; i++) {
        if (lines[i] !== lines[i - 1]) unique.push(lines[i]);
    }

    let transcript = "";
    let buffer = "";

    for (const line of unique) {
        buffer += (buffer ? " " : "") + line;
        if (/[.!?]$/.test(line??"")) {
            transcript += buffer + " ";
            buffer = "";
        }
    }

    if (buffer) transcript += buffer;

    return transcript.trim();
};

// FileSaving
export function fileSaving(filePathName:string, cleanData:string, deletingFile:string) {
    console.log(`newPathname #-----> ${filePathName} <-----#`);

    fs.writeFile(`${filePathName}.txt`, cleanData, { encoding: "utf-8" }, (err) => {
        if (err) {
            console.log(`Error in the time of saving file`, err);
        } else {
            console.log(`All things are correct`);
            console.log({ deletingFile });
            fs.unlinkSync(deletingFile)
        }
    });

}