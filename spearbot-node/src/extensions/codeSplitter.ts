import { TextSplitter } from "langchain/text_splitter";

export abstract class JavascriptBaseTextSplitter extends TextSplitter {
    abstract regex: RegExp;
  
    async splitText(text: string): Promise<string[]> {
      // use regex to split among all js and ts style function definitions
  
      const results: string[] = [];
  
      let remainingText = text;
      let match = remainingText.match(this.regex);
  
      // find our first match
      while (match && match[0]) {
        // find and remove our first match - this is the start of our string
        // it should be index 0
        // only do this if this isn't our first run through
  
        let matchingText = "";
  
        if (text !== remainingText) {
          [matchingText] = match;
          const matchingIndex = match.indexOf(matchingText);
  
          if (matchingIndex !== 0)
            throw new Error(
              `Unexpected matching index - should be zero. Got ${matchingIndex}`
            );
  
          // remove the matching text from the remaining text
          remainingText = remainingText.slice(matchingText.length);
        }
  
        // find the next match
        match = remainingText.match(this.regex);
  
        if (match && match[0]) {
          const nextIndex = match.index;
          // add text up to the next index & remove from remaining text
          const result = matchingText + remainingText.slice(0, nextIndex);
          results.push(result.trim());
          remainingText = remainingText.slice(nextIndex);
        } else {
          // If not another match, add all remaining text. We're done.
          results.push((matchingText + remainingText).trim());
        }
      }
  
      return results;
    }
  }
  
  export class JavascriptClassTextSplitter extends JavascriptBaseTextSplitter {
    regex = /(((.*\/\/.*\n)*)|(.*\/\*.*\n))(.*((class)|(interface)).*)/;
  }
  export class JavascriptFunctionTextSplitter extends JavascriptBaseTextSplitter {
    regex = /(((.*\/\/.*\n)*)|(.*\/\*.*\n))(.*((function)|(constructor)).*)/;
  }
  
  export class JavascriptTextSplitter extends JavascriptBaseTextSplitter {
    regex =
      /(((.*\/\/.*\n)*)|(.*\/\*.*\n))(.*((function)|(constructor)|(class)|(interface)).*)/;
  }
  
  export abstract class BaseCodeSplitter extends TextSplitter {
    public regex: RegExp;
  
    async splitText(text: string): Promise<string[]> {
      // use regex to split among all js and ts style function definitions
  
      const results: string[] = [];
  
      let remainingText = text;
      let match = remainingText.match(this.regex);
  
      // find our first match
      while (match && match[0]) {
        // find and remove our first match - this is the start of our string
        // it should be index 0
        // only do this if this isn't our first run through or if we have an immediate match
  
        let matchingText = "";
  
        if (text !== remainingText || match.indexOf(match[0]) === 0) {
          [matchingText] = match;
          const matchingIndex = match.indexOf(matchingText);
  
          if (matchingIndex !== 0)
            throw new Error(
              `Unexpected matching index - should be zero. Got ${matchingIndex}`
            );
  
          // remove the matching text from the remaining text
          remainingText = remainingText.slice(matchingText.length);
        }
  
        // find the next match
        match = remainingText.match(this.regex);
  
        if (match && match[0]) {
          const nextIndex = match.index;
          // add text up to the next index & remove from remaining text
          const result = matchingText + remainingText.slice(0, nextIndex);
          results.push(result.trim());
          remainingText = remainingText.slice(nextIndex);
        } else {
          // If not another match, add all remaining text. We're done.
          results.push((matchingText + remainingText).trim());
        }
      }
  
      return results;
    }
  }
  
  export class GenericCodeTextSplitter extends BaseCodeSplitter {
    constructor(keywords: string[], fields?: Partial<TextSplitter>) {
      super(fields);
  
      let partialRegex = "";
      for (const keyword of keywords) {
        partialRegex += `(${keyword})|`;
      }
  
      partialRegex = partialRegex.slice(0, partialRegex.length - 1);
  
      this.regex = new RegExp(
        `(((.*\\/\\/.*\n)*)|(.*\\/\\*.*\n))(.*(${partialRegex}).*)`
      );
    }
  }