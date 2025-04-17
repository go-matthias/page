const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createNewPost() {
  try {
    // Get post details
    const title = await question('Enter post title: ');
    const excerpt = await question('Enter post excerpt: ');
    const tags = await question('Enter tags (comma-separated, press enter for none): ');

    // Generate filename from title
    const filename = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Get current date
    const date = new Date().toISOString().split('T')[0];

    // Create post content
    const postContent = `---
title: "${title}"
date: "${date}"
excerpt: "${excerpt}"
${tags.trim() ? `tags: ${JSON.stringify(tags.split(',').map(t => t.trim()))}` : ''}
---

# ${title}

Write your introduction here...

## Section 1

Your content here...

## Section 2

More content...

### Subsection

- Bullet points
- More points

## Code Example (if needed)

\`\`\`javascript
// Your code here
console.log("Hello World!");
\`\`\`

## Conclusion

Wrap up your post here...`;

    // Write new post
    const postPath = path.join(__dirname, '..', 'content', `${filename}.md`);
    await fs.writeFile(postPath, postContent);

    console.log(`\nCreated new post: ${postPath}`);
    console.log('Run npm run build to update your site');
  } catch (error) {
    console.error('Error creating post:', error);
  } finally {
    rl.close();
  }
}

createNewPost(); 