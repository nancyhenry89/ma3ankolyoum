// src/utils/copticLegacy.ts
// Converts Coptic Unicode letters to a legacy ASCII layout used by Avva Shenouda / CS Avva Shenouda fonts.
// Note: This is a practical mapping for common letters used in Coptic words.
// If you find a letter that shows wrong, tell me the word and I'll extend the mapping.

const MAP: Record<string, string> = {
    // Lowercase Coptic (common)
    "ⲁ": "a",
    "ⲃ": "b",
    "ⲅ": "g",
    "ⲇ": "d",
    "ⲉ": "e",
    "ⲍ": "z",
    "ⲏ": "h",
    "ⲑ": "q",
    "ⲓ": "i",
    "ⲕ": "k",
    "ⲗ": "l",
    "ⲙ": "m",
    "ⲛ": "n",
    "ⲝ": "x",
    "ⲟ": "o",
    "ⲡ": "p",
    "ⲣ": "r",
    "ⲥ": "c", // sometimes "s" depending on font layout
    "ⲧ": "t",
    "ⲩ": "y",
    "ⲫ": "f",
    "ⲭ": "v",
    "ⲯ": "j",
    "ⲱ": "w",
  
    // Uppercase Coptic (common)
    "Ⲁ": "A",
    "Ⲃ": "B",
    "Ⲅ": "G",
    "Ⲇ": "D",
    "Ⲉ": "E",
    "Ⲍ": "Z",
    "Ⲏ": "H",
    "Ⲑ": "Q",
    "Ⲓ": "I",
    "Ⲕ": "K",
    "Ⲗ": "L",
    "Ⲙ": "M",
    "Ⲛ": "N",
    "Ⲝ": "X",
    "Ⲟ": "O",
    "Ⲡ": "P",
    "Ⲣ": "R",
    "Ⲥ": "C",
    "Ⲧ": "T",
    "Ⲩ": "Y",
    "Ⲫ": "F",
    "Ⲭ": "V",
    "Ⲯ": "J",
    "Ⲱ": "W",
  
    // extras you may see
    "ⲭ̄": "v", // if combining marks appear, we keep base
  };
  
  export function unicodeToAvvaLegacy(input: string): string {
    if (!input) return "";
  
    // Normalize (helps when combining marks exist)
    const s = input.normalize("NFC");
  
    let out = "";
    for (const ch of s) {
      out += (MAP[ch] ?? ch);
    }
    return out;
  }
  