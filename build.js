/**
 * Static Site Generator for arnav.log
 * 
 * Converts markdown posts in content/posts/ to HTML using the post template.
 * Also generates the blog listing data.
 * 
 * Usage:
 *   node build.js          # Build once
 *   node build.js --watch  # Watch for changes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { marked } from 'marked';
import hljs from 'highlight.js';
import Mustache from 'mustache';

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const CONTENT_DIR = path.join(__dirname, 'content', 'posts');
const OUTPUT_DIR = path.join(__dirname, 'posts');
const TEMPLATE_PATH = path.join(__dirname, 'templates', 'post.html');
const BLOG_DATA_PATH = path.join(__dirname, 'blog', 'posts.json');
const CONTENT_IMAGES_DIR = path.join(__dirname, 'content', 'images');
const OUTPUT_IMAGES_DIR = path.join(__dirname, 'images');

// Configure marked with syntax highlighting
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {
        console.warn(`Highlight error for language ${lang}:`, err.message);
      }
    }
    return hljs.highlightAuto(code).value;
  },
  gfm: true,
  breaks: false,
  pedantic: false,
  smartLists: true,
  smartypants: true
});

// Custom renderer for additional styling
const renderer = new marked.Renderer();

// Code blocks - clean terminal style without copy button
renderer.code = function(code, language) {
  const validLang = language && hljs.getLanguage(language) ? language : 'plaintext';
  let highlighted;
  
  try {
    highlighted = hljs.highlight(code, { language: validLang }).value;
  } catch {
    highlighted = hljs.highlightAuto(code).value;
  }
  
  return `<div class="code-block">
    <div class="code-block-header">
      <span class="code-dot red"></span>
      <span class="code-dot yellow"></span>
      <span class="code-dot green"></span>
      <span class="code-lang">${validLang}</span>
    </div>
    <pre class="code-body"><code class="hljs language-${validLang}">${highlighted}</code></pre>
  </div>`;
};

// Add IDs to headings for TOC linking
renderer.heading = function(text, level) {
  const slug = slugify(text);
  return `<h${level} id="${slug}">${text}</h${level}>`;
};

// Add target="_blank" to external links
renderer.link = function(href, title, text) {
  const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));
  const titleAttr = title ? ` title="${title}"` : '';
  const externalAttrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
  return `<a href="${href}"${titleAttr}${externalAttrs}>${text}</a>`;
};

marked.use({ renderer });

// Utilities
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '')  // Remove HTML tags
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Collapse multiple hyphens
    .trim();
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function calculateReadingTime(text) {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

function countWords(text) {
  return text.trim().split(/\s+/).length;
}

function formatDate(date) {
  const d = new Date(date);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getISODate(date) {
  return new Date(date).toISOString().split('T')[0];
}

// Copy images from content/images to root images directory
function copyImages() {
  if (!fs.existsSync(CONTENT_IMAGES_DIR)) {
    return 0;
  }
  
  if (!fs.existsSync(OUTPUT_IMAGES_DIR)) {
    fs.mkdirSync(OUTPUT_IMAGES_DIR, { recursive: true });
  }
  
  const images = fs.readdirSync(CONTENT_IMAGES_DIR);
  let copied = 0;
  
  for (const image of images) {
    const src = path.join(CONTENT_IMAGES_DIR, image);
    const dest = path.join(OUTPUT_IMAGES_DIR, image);
    
    // Only copy files, not directories
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, dest);
      copied++;
    }
  }
  
  return copied;
}

// Read all markdown files
function getMarkdownFiles() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.log(`Creating content directory: ${CONTENT_DIR}`);
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
    return [];
  }
  
  return fs.readdirSync(CONTENT_DIR)
    .filter(file => file.endsWith('.md'))
    .map(file => path.join(CONTENT_DIR, file));
}

// Parse a markdown file
function parseMarkdownFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content } = matter(fileContent);
  
  // Extract plain text for word count (strip markdown)
  const plainText = content
    .replace(/```[\s\S]*?```/g, '')  // Remove code blocks
    .replace(/`[^`]*`/g, '')          // Remove inline code
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')  // Replace links with text
    .replace(/[#*_~`]/g, '');         // Remove markdown chars
  
  const wordCount = countWords(plainText);
  const readingTime = calculateReadingTime(plainText);
  
  // Convert markdown to HTML
  const htmlContent = marked(content);
  
  // Generate slug from filename
  const slug = path.basename(filePath, '.md');
  
  return {
    slug,
    filePath,
    frontmatter,
    content: htmlContent,
    rawContent: content,
    wordCount,
    readingTime,
    // Normalize frontmatter fields
    title: frontmatter.title || 'Untitled',
    description: frontmatter.description || frontmatter.summary || '',
    date: frontmatter.date || new Date(),
    tags: frontmatter.tags || frontmatter.categories || [],
    draft: frontmatter.draft || false
  };
}

// Generate HTML for a single post
function generatePostHtml(post, allPosts, template) {
  const siteUrl = 'https://arnav.dev'; // Replace with actual URL
  const postUrl = `${siteUrl}/posts/${post.slug}.html`;
  
  // Find prev/next posts
  const publishedPosts = allPosts
    .filter(p => !p.draft)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const currentIndex = publishedPosts.findIndex(p => p.slug === post.slug);
  const prevPost = currentIndex < publishedPosts.length - 1 ? publishedPosts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? publishedPosts[currentIndex - 1] : null;
  
  const templateData = {
    title: post.title,
    description: post.description,
    date: formatDate(post.date),
    isoDate: getISODate(post.date),
    tags: post.tags,
    readingTime: post.readingTime,
    wordCount: post.wordCount.toLocaleString(),
    content: post.content,
    url: postUrl,
    encodedUrl: encodeURIComponent(postUrl),
    encodedTitle: encodeURIComponent(post.title),
    navigation: (prevPost || nextPost) ? {
      prev: prevPost ? {
        url: `${prevPost.slug}.html`,
        title: prevPost.title
      } : null,
      next: nextPost ? {
        url: `${nextPost.slug}.html`,
        title: nextPost.title
      } : null
    } : null
  };
  
  return Mustache.render(template, templateData);
}

// Generate blog listing JSON data
function generateBlogListingData(posts) {
  const publishedPosts = posts
    .filter(p => !p.draft)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  
  return publishedPosts.map(post => ({
    slug: post.slug,
    url: `../posts/${post.slug}.html`,
    title: post.title,
    description: post.description,
    date: formatDate(post.date),
    isoDate: getISODate(post.date),
    tags: post.tags,
    readingTime: post.readingTime,
    wordCount: post.wordCount
  }));
}

// Main build function
async function build() {
  console.log('\n🔧 Building arnav.log...\n');
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Ensure blog directory exists
  const blogDir = path.dirname(BLOG_DATA_PATH);
  if (!fs.existsSync(blogDir)) {
    fs.mkdirSync(blogDir, { recursive: true });
  }
  
  // Copy images from content/images to root images/
  const imagesCopied = copyImages();
  if (imagesCopied > 0) {
    console.log(`📷 Copied ${imagesCopied} image(s) to images/\n`);
  }
  
  // Read template
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error(`❌ Template not found: ${TEMPLATE_PATH}`);
    process.exit(1);
  }
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  
  // Get all markdown files
  const markdownFiles = getMarkdownFiles();
  
  if (markdownFiles.length === 0) {
    console.log('📝 No markdown files found in content/posts/');
    console.log('   Create .md files with YAML frontmatter to get started.\n');
    return;
  }
  
  console.log(`📄 Found ${markdownFiles.length} markdown file(s)\n`);
  
  // Parse all posts
  const posts = markdownFiles.map(parseMarkdownFile);
  
  // Filter out drafts for listing, but still generate them
  const publishedCount = posts.filter(p => !p.draft).length;
  const draftCount = posts.filter(p => p.draft).length;
  
  // Generate HTML for each post
  let generatedCount = 0;
  for (const post of posts) {
    const html = generatePostHtml(post, posts, template);
    const outputPath = path.join(OUTPUT_DIR, `${post.slug}.html`);
    
    fs.writeFileSync(outputPath, html, 'utf-8');
    
    const status = post.draft ? '(draft)' : '';
    console.log(`   ✓ ${post.slug}.html ${status}`);
    generatedCount++;
  }
  
  // Generate blog listing data
  const listingData = generateBlogListingData(posts);
  fs.writeFileSync(BLOG_DATA_PATH, JSON.stringify(listingData, null, 2), 'utf-8');
  console.log(`\n   ✓ blog/posts.json (${listingData.length} posts)`);
  
  // Summary
  console.log('\n─────────────────────────────────────');
  console.log(`✅ Build complete!`);
  console.log(`   ${publishedCount} published, ${draftCount} drafts`);
  console.log(`   Output: ${OUTPUT_DIR}/`);
  console.log('─────────────────────────────────────\n');
}

// Watch mode
function watch() {
  console.log('👀 Watching for changes in content/posts/...\n');
  console.log('   Press Ctrl+C to stop.\n');
  
  // Initial build
  build();
  
  // Watch content directory
  if (fs.existsSync(CONTENT_DIR)) {
    fs.watch(CONTENT_DIR, { recursive: true }, (eventType, filename) => {
      if (filename && filename.endsWith('.md')) {
        console.log(`\n📝 Change detected: ${filename}`);
        build();
      }
    });
  }
  
  // Watch template
  if (fs.existsSync(TEMPLATE_PATH)) {
    fs.watch(TEMPLATE_PATH, () => {
      console.log('\n📝 Template changed');
      build();
    });
  }
}

// CLI
const args = process.argv.slice(2);
if (args.includes('--watch') || args.includes('-w')) {
  watch();
} else {
  build();
}
