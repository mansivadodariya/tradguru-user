/**
 * Bidi & Language Detection Utilities
 * Handles mixed Arabic and English content directionality.
 */

import React from 'react';

/**
 * Detects whether text is primarily Arabic or English/Latin.
 * @param {string} text - The input string to evaluate.
 * @return {'ar' | 'en'} Language code.
 */
export function detectLanguage(text) {
    if (!text || typeof text !== 'string') return 'en';

    // Strip HTML tags and markdown symbols for accurate character counting
    const cleanText = text
        .replace(/<[^>]*>/g, '')
        .replace(/[*_#`~\[\]()]+/g, ' ')
        .trim();

    if (!cleanText) return 'en';

    // Regex for Arabic character ranges (including Extended Arabic, Supplement, Presentation Forms)
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
    // Regex for Latin character ranges
    const latinPattern = /[a-zA-Z]/g;

    const arabicMatches = cleanText.match(arabicPattern) || [];
    const latinMatches = cleanText.match(latinPattern) || [];

    if (arabicMatches.length > latinMatches.length) {
        return 'ar';
    }
    if (latinMatches.length > 0) {
        return 'en';
    }

    return 'en';
}

/**
 * Gets the text direction ('rtl' or 'ltr') based on detected language.
 * @param {string} text - Input text.
 * @return {'rtl' | 'ltr'}
 */
export function getContentDirection(text) {
    return detectLanguage(text) === 'ar' ? 'rtl' : 'ltr';
}

/**
 * Generates props for HTML elements rendering dynamic text.
 * @param {string} text - Input text to evaluate.
 * @param {string} [extraClass=''] - Additional CSS class names.
 * @return {{ dir: string, 'data-lang': string, 'data-dir': string, className: string }}
 */
export function getBidiProps(text, extraClass = '') {
    const lang = detectLanguage(text);
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    const classes = `bidi-auto bidi-${dir} ${extraClass}`.trim();
    return {
        dir: 'auto',
        'data-lang': lang,
        'data-dir': dir,
        className: classes,
    };
}

/**
 * Standard ReactMarkdown custom components to enforce dir="auto" and bidi-auto on rendered blocks.
 */
export const bidiMarkdownComponents = {
    p: ({ children, ...props }) => (
        <p dir="auto" className="bidi-auto" {...props}>
            {children}
        </p>
    ),
    h1: ({ children, ...props }) => (
        <h1 dir="auto" className="bidi-auto" {...props}>
            {children}
        </h1>
    ),
    h2: ({ children, ...props }) => (
        <h2 dir="auto" className="bidi-auto" {...props}>
            {children}
        </h2>
    ),
    h3: ({ children, ...props }) => (
        <h3 dir="auto" className="bidi-auto" {...props}>
            {children}
        </h3>
    ),
    h4: ({ children, ...props }) => (
        <h4 dir="auto" className="bidi-auto" {...props}>
            {children}
        </h4>
    ),
    h5: ({ children, ...props }) => (
        <h5 dir="auto" className="bidi-auto" {...props}>
            {children}
        </h5>
    ),
    h6: ({ children, ...props }) => (
        <h6 dir="auto" className="bidi-auto" {...props}>
            {children}
        </h6>
    ),
    li: ({ children, ...props }) => (
        <li dir="auto" className="bidi-auto" {...props}>
            {children}
        </li>
    ),
    blockquote: ({ children, ...props }) => (
        <blockquote dir="auto" className="bidi-auto" {...props}>
            {children}
        </blockquote>
    ),
    td: ({ children, ...props }) => (
        <td dir="auto" className="bidi-auto" {...props}>
            {children}
        </td>
    ),
    th: ({ children, ...props }) => (
        <th dir="auto" className="bidi-auto" {...props}>
            {children}
        </th>
    ),
};
