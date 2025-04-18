const fs = require('fs-extra');
const path = require('path');
const marked = require('marked');
const matter = require('gray-matter');

// Configure marked for better security
marked.setOptions({
  headerIds: false,
  mangle: false
});

// Ensure dist directory exists
fs.ensureDirSync('dist');

// Copy static assets
fs.copySync('src/static', 'dist', { overwrite: true });

// Read all markdown files from content directory
const contentDir = path.join(__dirname, 'content');
const pagesDir = path.join(__dirname, 'pages');
const templateDir = path.join(__dirname, 'templates');

// Read and process markdown files
const processMarkdown = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  try {
    // More robust frontmatter parsing
    const { data, content: markdownContent } = matter(content.trim());
    const html = marked.parse(markdownContent.trim());
    
    console.log('Parsed frontmatter:', data); // Debug log
    
    return {
      ...data,
      content: html
    };
  } catch (error) {
    console.error('Error parsing frontmatter for file:', filePath, error);
    return { 
      title: path.basename(filePath, '.md'),
      content: marked.parse(content)
    };
  }
};

// Generate HTML from template and content
const generateHTML = (template, data) => {
  let html = template;
  Object.entries(data).forEach(([key, value]) => {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  return html;
};

// Main build function
const build = async () => {
  try {
    // Read templates
    const layoutTemplate = fs.readFileSync(path.join(templateDir, 'layout.html'), 'utf8');
    const postTemplate = fs.readFileSync(path.join(templateDir, 'post.html'), 'utf8');

    // Get all markdown files
    const markdownFiles = fs.readdirSync(contentDir).filter(file => file.endsWith('.md'));
    
    // Process blog posts
    const posts = markdownFiles
      .map(file => {
        const postData = processMarkdown(path.join(contentDir, file));
        console.log('Processing post:', file, postData); // Debug log
        const slug = file.replace('.md', '');
        return { 
          ...postData, 
          slug,
          url: `${slug}.html`
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date, newest first

    // Generate posts HTML for homepage
    const postsHTML = posts.map(post => `
      <article class="post-preview">
        <time class="post-date">${new Date(post.date).toLocaleDateString('en-US', { 
          month: 'numeric',
          day: 'numeric',
          year: 'numeric'
        }).replace(/\//g, '/')}</time>
        <div>
          <h2><a href="${post.url}">${post.title}</a></h2>
          ${post.excerpt ? `<p>${post.excerpt}</p>` : ''}
        </div>
      </article>
    `).join('');

    // Copy custom homepage
    const customHomepage = fs.readFileSync(path.join(pagesDir, 'index.html'), 'utf8');
    const homePage = generateHTML(customHomepage, {
      posts: postsHTML
    });
    fs.writeFileSync(path.join('dist', 'index.html'), homePage);

    // Generate individual post pages
    posts.forEach(post => {
      const postContent = generateHTML(postTemplate, {
        title: post.title,
        date: new Date(post.date).toLocaleDateString('en-US', { 
          month: 'numeric',
          day: 'numeric',
          year: 'numeric'
        }).replace(/\//g, '/'),
        content: post.content
      });

      const postPage = generateHTML(layoutTemplate, {
        title: `${post.title || 'Untitled Post'} - My Personal Blog`,
        content: postContent
      });

      fs.writeFileSync(path.join('dist', post.url), postPage);
    });

    // Generate pages from pages directory
    const pageFiles = fs.readdirSync(pagesDir)
      .filter(file => file.endsWith('.md') || (file.endsWith('.html') && file !== 'index.html'));
    
    pageFiles.forEach(file => {
      if (file.endsWith('.md')) {
        const data = processMarkdown(path.join(pagesDir, file));
        const pageContent = generateHTML(postTemplate, {
          title: data.title,
          content: data.content
        });

        const page = generateHTML(layoutTemplate, {
          title: `${data.title} - My Personal Blog`,
          content: pageContent
        });

        const outputFile = file.replace('.md', '.html');
        fs.writeFileSync(path.join('dist', outputFile), page);
      } else if (file.endsWith('.html')) {
        // Copy HTML files directly
        fs.copyFileSync(
          path.join(pagesDir, file),
          path.join('dist', file)
        );
      }
    });

    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
  }
};

build();
