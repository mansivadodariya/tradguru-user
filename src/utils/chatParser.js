/**
 * Interface definition for ParsedChatMessage
 * @typedef {Object} ParsedChatMessage
 * @property {string} disclaimerHeader
 * @property {string} disclaimerFooter
 * @property {object|null} jsonData
 * @property {string} fallbackText
 */

/**
 * Parses raw chat message text and extracts disclaimer header, footer,
 * embedded JSON analysis report, and clean fallback text.
 * 
 * @param {string|object} rawText
 * @param {string|object} [fullReport]
 * @returns {ParsedChatMessage}
 */
export function parseChatMessage(rawText, fullReport) {
  const result = {
    disclaimerHeader: '',
    disclaimerFooter: '',
    jsonData: null,
    fallbackText: ''
  };

  if (!rawText && !fullReport) return result;

  const sourceText = typeof rawText === 'string' ? rawText : (rawText ? JSON.stringify(rawText) : '');
  const reportText = typeof fullReport === 'string' ? fullReport : (fullReport ? JSON.stringify(fullReport) : '');

  // 1. Extract Disclaimer Header if present (e.g. "> ⚠️ **Disclaimer: ...**\n\n")
  const headerMatch = sourceText.match(/^(>\s*⚠️[\s\S]*?\n\n)/i) ||
                      sourceText.match(/^(>\s*\[!WARNING\][\s\S]*?\n\n)/i) ||
                      sourceText.match(/^(\*\*⚠️[^\n]*\*\*[\s\S]*?\n\n)/i) ||
                      sourceText.match(/^(>\s*\*\*Disclaimer:[\s\S]*?\n\n)/i);
  if (headerMatch) {
    result.disclaimerHeader = headerMatch[1].trim();
  }

  // 2. Extract Disclaimer Footer if present (e.g. "\n\n***Disclaimer: ...***")
  const footerMatch = sourceText.match(/(\n\n\*\*\*Disclaimer:[\s\S]*?\*?)$/i) ||
                      sourceText.match(/(\n\n\*\*Disclaimer:[\s\S]*?\*?)$/i) ||
                      sourceText.match(/(\n\n>\s*⚠️[\s\S]*?)$/i) ||
                      sourceText.match(/(\n\n>\s*\*\*Disclaimer:[\s\S]*?)$/i);
  if (footerMatch) {
    result.disclaimerFooter = footerMatch[1].trim();
  }

  // 3. Try to extract JSON object from fullReport or sourceText
  const textToParse = reportText || sourceText;
  if (typeof textToParse === 'object' && textToParse !== null) {
    result.jsonData = textToParse;
  } else if (typeof textToParse === 'string') {
    const jsonMatch = textToParse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        result.jsonData = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.warn("Could not parse embedded JSON in message:", e);
        result.jsonData = null;
      }
    }
  }

  // If reportText didn't give JSON, also check sourceText
  if (!result.jsonData && sourceText && sourceText !== textToParse) {
    const jsonMatchSource = sourceText.match(/\{[\s\S]*\}/);
    if (jsonMatchSource) {
      try {
        result.jsonData = JSON.parse(jsonMatchSource[0]);
      } catch (_) {}
    }
  }

  // 4. Extract Fallback Prose Text (Stripping all JSON, code fences, and truncated JSON blocks)
  let cleanText = sourceText;
  if (headerMatch && headerMatch[1]) {
    cleanText = cleanText.replace(headerMatch[1], '');
  }
  if (footerMatch && footerMatch[1]) {
    cleanText = cleanText.replace(footerMatch[1], '');
  }

  // Remove code fences ```json ... ```
  cleanText = cleanText.replace(/```(?:json)?[\s\S]*?```/gi, '');

  // Remove any complete { ... } JSON block
  cleanText = cleanText.replace(/\{[\s\S]*\}/g, '');

  // Remove any unclosed/truncated { "is_valid_chart"... or { "detected_pair"...
  cleanText = cleanText.replace(/\{[\s\S]*/g, '');

  cleanText = cleanText.trim();

  // If cleanText starts with JSON fragment or consists of JSON characters, discard it
  if (
    /^\s*\{/i.test(cleanText) ||
    /\"is_valid_chart\"|\"detected_pair\"|\"overall_trend\"|\"market_structure\"/i.test(cleanText)
  ) {
    cleanText = '';
  }

  result.fallbackText = cleanText;

  return result;
}

export default parseChatMessage;
