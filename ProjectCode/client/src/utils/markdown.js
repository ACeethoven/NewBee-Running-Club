/**
 * Safe markdown rendering utility
 * Wraps marked with DOMPurify sanitization to prevent XSS attacks
 */

import DOMPurify from 'dompurify';
import { marked } from 'marked';

// Configure DOMPurify with allowed tags and attributes
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'ul', 'ol', 'li',
    'strong', 'em', 'b', 'i', 'u', 's', 'del',
    'a', 'code', 'pre', 'blockquote',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'img', 'span', 'div'
  ],
  ALLOWED_ATTR: [
    'href', 'title', 'target', 'rel',
    'src', 'alt', 'width', 'height',
    'class', 'id'
  ],
  // Force all links to open in new tab with security attributes
  ADD_ATTR: ['target', 'rel'],
  FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover']
};

// Configure marked options
marked.setOptions({
  breaks: true,
  gfm: true
});

/**
 * Safely render markdown to HTML with XSS protection
 * @param {string} markdownText - The markdown text to render
 * @param {Object} options - Optional marked options override
 * @returns {string} - Sanitized HTML string
 */
export function safeMarkdown(markdownText, options = {}) {
  if (!markdownText) {
    return '';
  }

  // Parse markdown to HTML
  const rawHtml = marked(markdownText, { breaks: true, ...options });

  // Sanitize the HTML to prevent XSS
  const cleanHtml = DOMPurify.sanitize(rawHtml, PURIFY_CONFIG);

  return cleanHtml;
}

export default safeMarkdown;
