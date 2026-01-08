(function() {
  'use strict';

  // Markdown patterns to detect
  const MARKDOWN_PATTERNS = [
    /```[\s\S]+?```/,           // Code blocks
    /`[^`]+`/,                   // Inline code
    /\*\*[^*]+\*\*/,             // Bold
    /\*[^*]+\*/,                 // Italic
    /~~[^~]+~~/,                 // Strikethrough
    /^#{1,6}\s/m,                // Headers
    /^\s*[-*+]\s/m,              // Unordered lists
    /^\s*\d+\.\s/m,              // Ordered lists
    /\[.+?\]\(.+?\)/,            // Links
    /^>\s/m                      // Blockquotes
  ];

  // Check if text contains Markdown
  function containsMarkdown(text) {
    return MARKDOWN_PATTERNS.some(pattern => pattern.test(text));
  }

  // Preprocess text to fix common issues from Twitter's formatting
  function preprocessText(text) {
    let processed = text;

    // Normalize line endings
    processed = processed.replace(/\r\n/g, '\n');

    // Remove excessive blank lines (more than 2 consecutive newlines -> 2)
    processed = processed.replace(/\n{3,}/g, '\n\n');

    // Fix list items: ensure single newline before list items (not double)
    // This handles cases where Twitter adds extra line breaks
    processed = processed.replace(/\n\n+([-*+])\s/g, '\n$1 ');
    processed = processed.replace(/\n\n+(\d+\.)\s/g, '\n$1 ');

    // Fix blockquotes: ensure proper formatting
    processed = processed.replace(/\n\n+(>)/g, '\n$1');

    // Trim trailing whitespace from each line
    processed = processed.split('\n').map(line => line.trimEnd()).join('\n');

    // Trim overall
    processed = processed.trim();

    return processed;
  }

  // Post-process HTML to clean up excessive elements
  function postprocessHTML(html) {
    let processed = html;

    // Only remove whitespace INSIDE blockquotes and lists (not between sections)
    processed = processed.replace(/<blockquote>\s+<ul>/g, '<blockquote><ul>');
    processed = processed.replace(/<\/ul>\s+<\/blockquote>/g, '</ul></blockquote>');
    processed = processed.replace(/<blockquote>\s+<p>/g, '<blockquote><p>');
    processed = processed.replace(/<\/p>\s+<\/blockquote>/g, '</p></blockquote>');
    processed = processed.replace(/<ul>\s+<li>/g, '<ul><li>');
    processed = processed.replace(/<\/li>\s+<\/ul>/g, '</li></ul>');
    processed = processed.replace(/<ol>\s+<li>/g, '<ol><li>');
    processed = processed.replace(/<\/li>\s+<\/ol>/g, '</li></ol>');
    processed = processed.replace(/<\/li>\s+<li>/g, '</li><li>');

    // Remove empty paragraphs
    processed = processed.replace(/<p>\s*<\/p>/g, '');

    // Remove excessive <br> tags
    processed = processed.replace(/(<br\s*\/?>\s*){2,}/g, '<br>');

    return processed;
  }

  // Get tweet text element selector
  const TWEET_TEXT_SELECTOR = '[data-testid="tweetText"]';

  // Track processed tweets
  const processedTweets = new WeakSet();

  // Configure marked options
  function configureMarked() {
    if (typeof marked !== 'undefined') {
      marked.setOptions({
        breaks: false,  // Don't convert single newlines to <br>
        gfm: true
      });
    }
  }

  // Process a single tweet
  function processTweet(tweetTextElement) {
    if (processedTweets.has(tweetTextElement)) {
      return;
    }

    const originalText = tweetTextElement.innerText;

    if (!containsMarkdown(originalText)) {
      processedTweets.add(tweetTextElement);
      return;
    }

    try {
      // Preprocess text
      const cleanedText = preprocessText(originalText);

      // Parse Markdown
      let renderedHTML = marked.parse(cleanedText);

      // Post-process HTML
      renderedHTML = postprocessHTML(renderedHTML);

      // Create wrapper for rendered content
      const wrapper = document.createElement('div');
      wrapper.className = 'twitter-md-rendered';
      wrapper.innerHTML = renderedHTML;

      // Add toggle button to show original
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'twitter-md-toggle';
      toggleBtn.textContent = 'MD';
      toggleBtn.title = 'Toggle Markdown view';

      let showingRendered = true;
      const originalHTML = tweetTextElement.innerHTML;

      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();

        if (showingRendered) {
          tweetTextElement.innerHTML = originalHTML;
          toggleBtn.classList.remove('active');
        } else {
          tweetTextElement.innerHTML = '';
          tweetTextElement.appendChild(wrapper.cloneNode(true));
        }
        showingRendered = !showingRendered;
      });

      // Replace content with rendered Markdown
      tweetTextElement.innerHTML = '';
      tweetTextElement.appendChild(wrapper);

      // Add toggle button to tweet
      const tweetContainer = tweetTextElement.closest('article');
      if (tweetContainer) {
        const actionBar = tweetContainer.querySelector('[role="group"]');
        if (actionBar && !actionBar.querySelector('.twitter-md-toggle')) {
          actionBar.appendChild(toggleBtn);
        }
      }

      processedTweets.add(tweetTextElement);
    } catch (error) {
      console.error('Twitter Markdown Viewer: Error processing tweet', error);
      processedTweets.add(tweetTextElement);
    }
  }

  // Process all tweets on the page
  function processAllTweets() {
    const tweets = document.querySelectorAll(TWEET_TEXT_SELECTOR);
    tweets.forEach(processTweet);
  }

  // Initialize
  function init() {
    configureMarked();

    // Process existing tweets
    processAllTweets();

    // Watch for new tweets (infinite scroll)
    const observer = new MutationObserver((mutations) => {
      let shouldProcess = false;

      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldProcess = true;
          break;
        }
      }

      if (shouldProcess) {
        // Debounce processing
        clearTimeout(window.twitterMdTimeout);
        window.twitterMdTimeout = setTimeout(processAllTweets, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Wait for marked.js to load, then initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
