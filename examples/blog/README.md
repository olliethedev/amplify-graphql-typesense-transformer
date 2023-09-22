# Amplify Typesense Plugin Example

This is an example of how to use the Amplify Typesense Plugin.

1. Create Blog Post: Users can create a new blog post by entering a name and clicking the "Save" button. The created post is indexed by the Typesense transformer plugin.

2. Search Blog Posts: Users can search for existing blog posts by name. The search functionality is powered by the Typesense transformer plugin, which searches previously indexed blog posts.

3. Update Blog Post: Users can update an existing blog post by entering the post's ID, new name, and version, then clicking the "Update" button. The updated post is re-indexed by the Typesense transformer plugin.

4. Delete Blog Post: Users can delete an existing blog post by entering the post's ID and version, then clicking the "Delete" button. The deleted post is removed from the Typesense transformer plugin's index.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.
