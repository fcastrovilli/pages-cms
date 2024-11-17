# Pages CMS - Fork

## Recent Changes and Improvements

This fork of Pages CMS includes several enhancements and new features:

- **WebP Image Support**: Automatic conversion of uploaded images to WebP format for better performance
- **Files Field**: New field type for handling file uploads and management
- **Enhanced Image Handling**: Improved compatibility and support for image lists
- **UI Improvements**: Fixed list and grid views for better user experience
- **Field Validation**: Enhanced validation for files and images
- **Collection Pagination**: Added pagination support for collection pages with configurable items per page

### New Features Documentation

#### File Field

The `file` field type allows you to manage file uploads in your content. Unlike the `image` field, it supports any file type and provides additional functionality for file management.

##### Multiple Files Support

There are two ways to handle multiple files:

1. Using `multiple: true`:
```yaml
- name: attachments
  type: file
  options:
    multiple: true  # Enable grid view for multiple files
    extensions: ["pdf", "doc", "docx"]
```
This creates a grid view where you can:
- Select multiple files at once
- Manage files in a visual grid layout
- All files are selected from the same directory
- Files are stored as an array in the data structure

2. Using `list: true`:
```yaml
- name: documents
  type: file
  list: true  # Enable list view with individual file fields
  options:
    extensions: ["pdf", "doc"]
```
This creates a list of individual file fields that:
- Can be reordered using drag and drop
- Each file can be selected from different directories
- Provides more control over individual files
- Files are stored as list items that can be reordered

Choose `multiple: true` when you need a simple way to manage a collection of related files in a grid view. Use `list: true` when you need more control over individual files and want the ability to reorder them.

##### Example Configuration

```yaml
- name: attachment
  label: Document Attachment
  type: file
  options:
    multiple: true # Allow multiple files (optional)
    path: /documents # Custom upload path (optional)
    extensions: ["pdf", "doc", "docx"] # Limit file types (optional)
    input: /static/uploads # Input directory for files (optional)
    output: /uploads # Public URL path prefix (optional)
    list: true # Use list view instead of grid (optional)
    required: true # Make the field required (optional)
```

Available Options:

- `multiple`: Boolean, allows multiple file uploads (default: false)
- `path`: String, custom upload directory path relative to media folder
- `extensions`: Array, limit file types (optional)
- `input`: String, input directory for files (optional)
- `output`: String, public URL path prefix (optional)
- `list`: Boolean, use list view instead of grid view (default: false)
- `required`: Boolean, make the field required (default: false)

Features:

- Supports any file type
- Single or multiple file uploads
- Custom upload paths
- File preview when possible
- Drag and drop support
- File size display
- Grid and list view options

#### Collection Pagination

The collection pages now include built-in pagination support to improve navigation and performance when dealing with large collections. The pagination system provides:

- 10 items per page by default
- Previous/Next navigation buttons
- Current page and total pages indicator
- Automatic page calculation based on collection size
- Maintains search and sort settings while paginating
- Responsive design that works on all screen sizes

The pagination controls appear automatically when there are more items than the per-page limit, providing a seamless experience for both small and large collections.

#### Media Path Configuration

This fork includes enhanced media path handling that allows you to configure both input paths (where files are stored in your repository) and output paths (how they appear in your final website). This can be configured both globally and per-field.

##### Global Media Configuration

Configure global media paths in your `.pages.yml`:

```yaml
media:
  input: static/media  # Where files are stored in your repo
  output: /media      # How paths appear in your content files
  optimize:
    enabled: true     # Enable image optimization
    maxWidth: 1920    # Maximum image width
    maxHeight: 1080   # Maximum image height
    quality: 0.80     # WebP quality (0-1)
```

##### Field-Specific Configuration

You can override the global media paths for specific fields:

```yaml
fields:
  - name: image
    label: 'Main Image'
    type: image
    options:
      input: static/media/images   # Override global input path
      output: /media/images        # Override global output path
  
  - name: attachment
    label: 'Document'
    type: file
    options:
      input: static/media/docs     # Different path for documents
      output: /media/docs          # Different public URL for documents
```

##### Path Transformation Examples

The system automatically transforms paths between input and output formats:

1. **Basic Image Path**:
   - Input (in repo): `static/media/photo.jpg`
   - Output (in content): `/media/photo.jpg`

2. **Nested Image Path**:
   - Input: `static/media/images/blog/photo.jpg`
   - Output: `/media/images/blog/photo.jpg`

3. **Field-Specific Path**:
   ```yaml
   # Field configuration
   - name: avatar
     type: image
     options:
       input: static/media/profiles
       output: /media/profiles
   ```
   - Input: `static/media/profiles/user.jpg`
   - Output: `/media/profiles/user.jpg`

##### Path Format Notes

- Paths are normalized to handle various formats:
  - Leading slashes are optional in configuration
  - Trailing slashes are automatically removed
  - Multiple consecutive slashes are normalized
  - Both forward and backward slashes are supported

These examples all work the same:
```yaml
media:
  input: static/media/
  output: /media

# or
media:
  input: static/media
  output: media/

# or
media:
  input: static\media\\\
  output: /media/
```

##### Path Resolution Priority

1. Field-specific paths take precedence if configured
2. Falls back to global media paths if field-specific paths aren't set
3. Uses empty string as fallback if no paths are configured

This flexible path configuration allows you to:
- Organize media files logically in your repository
- Generate clean, SEO-friendly URLs in your final website
- Have different paths for different types of media
- Maintain compatibility with various static site generators

#### Media Settings and Image Optimization

This fork includes enhanced media settings for image optimization. Configure these in your `.pages.yml` file:

```yaml
media:
  folder: static/uploads # Base media folder
  public_folder: /uploads # Public URL path
  optimize:
    enabled: true # Enable image optimization
    maxWidth: 1920 # Maximum image width
    maxHeight: 1080 # Maximum image height
    quality: 0.85 # WebP quality (0-1)
```

The image optimization settings are applied during upload and will:

- Automatically convert images to WebP format
- Resize images while maintaining aspect ratio
- Optimize quality for web use
- Preserve original filenames with .webp extension

Available Image Options:

- `enabled`: Boolean, enable image optimization (default: true)
- `maxWidth`: Number, maximum image width
- `maxHeight`: Number, maximum image height
- `quality`: Number, WebP quality (0-1)

#### Grid Layout System

The CMS includes a powerful grid layout system that allows you to control how fields are positioned and sized in the editor interface. The grid system is based on a 12-column layout and provides intuitive width options.

##### Basic Grid Configuration

Each field can have an optional `layout` property that controls its positioning:

```yaml
fields:
  - name: title
    label: 'Title'
    type: string
    layout:
      width: '1/2'  # Takes up half the width
  - name: subtitle
    label: 'Subtitle'
    type: string
    layout:
      width: '1/2'
      column: 6    # Starts at column 6 (optional)
```

##### Available Width Options

- `1/1`: Full width (12 columns)
- `1/2`: Half width (6 columns)
- `1/3`: One-third width (4 columns)
- `2/3`: Two-thirds width (8 columns)
- `1/4`: Quarter width (3 columns)
- `3/4`: Three-quarters width (9 columns)

##### Layout Properties

The `layout` object supports these properties:

- `width`: Required. One of the predefined width options
- `column`: Optional. Starting column (0-11)
- `row`: Optional. Row number for explicit positioning

##### Default Behavior

Fields without a layout configuration will:
- Take up full width (`1/1`)
- Be centered in the grid
- Stack naturally in the document flow

This is useful for:
- Complex fields that need more space (file uploads, rich text)
- Fields that should stand out from the grid layout
- Quick prototyping before finalizing the layout

##### Example Complex Layout

```yaml
fields:
  - name: title
    type: string
    layout:
      width: '2/3'  # Takes up 8 columns
  - name: category
    type: string
    layout:
      width: '1/3'  # Takes up 4 columns
  - name: description
    type: text
    layout:
      width: '1/1'  # Full width
  - name: images
    type: image
    list: true      # No layout - will be full width and centered
  - name: details
    type: grid      # Nested grid
    fields:
      - name: date
        type: date
        layout:
          width: '1/2'
      - name: author
        type: string
        layout:
          width: '1/2'
```

##### Grid Layout Best Practices

1. **Consistent Widths**: Try to use consistent width patterns (e.g., all `1/2` or all `1/3`) for a cleaner look
2. **Full Width for Complex Fields**: Leave complex fields (file uploads, rich text) without layout for better usability
3. **Logical Grouping**: Use width and positioning to group related fields together
4. **Responsive Design**: The grid system is responsive and will adjust for different screen sizes
5. **Optional Positioning**: Only use explicit `column` and `row` when specific positioning is required

#### Important Note About Date Fields

The official documentation for the date field at pagescms.org contains some inaccuracies. The date field in this fork uses Moment.js instead of date-fns, which means:

- The format string should follow [Moment.js format patterns](https://momentjs.com/docs/#/displaying/format/)
- Example format: `DD/MM/YYYY` (not `dd/MM/yyyy`)
- For time inclusion: `DD/MM/YYYY HH:mm` (not `dd-MM-yyyy HH:mm`)

Example configuration:

```yaml
- name: published_at
  label: Publication Date
  type: date
  options:
    format: DD/MM/YYYY
    time: true
```

---

# Pages CMS - Original Readme

[Pages CMS](https://pagescms.org) is an Open Source Content Management System built for static websites (Jekyll, Next.js, VuePress, Hugo, etc).

It allows you to edit your website's content directly on GitHub via a user-friendly interface.

<p align="center">
<img src="https://pagescms.org/media/screenshots/collection-dark@2x.png">
</p>

## Documentation

For full documentation, go to [pagescms.org/docs](https://pagescms.org/docs)

## How it works

Pages CMS is built as a [Vue.js](https://vuejs.org/) app with a few serverless functions to handle the Github login.

It is intended to be deployed with [Cloudflare Pages](https://pages.cloudflare.com/), using [Cloudflare Workers](https://workers.cloudflare.com/) (referred to as functions [functions](https://developers.cloudflare.com/pages/functions/)) for the serverless code.

In a nutshell:

- The serverless functions are just facilitating the OAuth dance (and logout) between the client and GitHub. The GitHub OAuth token is actually stored in the client.
- Once logged in, the Vue app lets you select the repo (and branch) where your content may be at.
- You can configure each repo/branch by adding a `.pages.yml` that describes the content structure and related settings (e.g. media folder).
- The Vue app acts as a user-friendly interface on top of the GitHub API to manage content related files in your repo. With it you can search and filter collections, create/edit/delete entries, upload media...

## Get started

### Use online

The easiest way to get started is to use [the online version of Pages CMS](https://app.pagescms.org). You'll be able to log in with your GitHub account and get the latest version of Pages CMS.

This online version is identical to what's in this repo and as mentioned above, nothing is saved in the backend (OAuth tokens are saved on the client side).

But you can also install your own version locally or deploy it (for free) on Cloudflare following the steps below.

### Install locally

To get a local version up and running:

1. **Install dependencies**: `npm install`.
1. **Create a GitHub OAuth app**: 0n GitHub, go to [your Developer Settings](https://github.com/settings/developers) and [create a New OAuth App](https://github.com/settings/applications/new) (or alternatively create one for one of your organizations). You can use the following settings for your development environment:
   - Application name: `Pages CMS (dev)`
   - Homepage URL: `https://pagescms.org`
   - Authorization callback URL: `http://localhost:8788/auth/callback`
1. **Create a file for environment variables**: copy `.dev.vars.exmple` into `.dev.vars` and replace `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` with the values you got for your GitHub OAuth app. You shouldn't have to modify `BASE_URL`.
1. **Run it**: `npm run dev`. This should [run the app locally with Wrangler](https://developers.cloudflare.com/pages/functions/local-development/) (allowing us to run the serverless functions locally).
1. **Visit [localhost:8788](http://localhost:8788)**.

### Deploy on Cloudflare

1. **Prerequisite**: you'll need a [Cloudflare](https://cloudflare.com) account (it's free). Once you have one:
1. **Create a [Cloudflare Pages](https://developers.cloudflare.com/pages/) app**:
   1. From your account dashboard, go to `Workers & Pages`, then click on `Create application` and select the `Pages` tab.
   1. From there you can connect your GitHub account and select the repo you want to deploy (assuming you've [forked pages-cms/pages-cms](https://github.com/pages-cms/pages-cms/fork)).
   1. Cloudflare will give you a public URL (e.g. https://pages-cms-123.pages.dev).
1. **Create a GitHub OAuth app**: same as for local, go to [your Developer Settings](https://github.com/settings/developers) and [create a New OAuth App](https://github.com/settings/applications/new) (or alternatively create one for one of your organizations) with the following settings:
   - **Application name**: `Pages CMS`
   - **Homepage URL**: `https://pagescms.org`
   - **Authorization callback URL**: `https://pages-cms-123.pages.dev/auth/callback` (replace `https://pages-cms-123.pages.dev` with whatever URL Cloudflare generated for you, or the custom domain you set up)
1. **Add the environment variables to Cloudflare**:
   1. Go back to your Cloudflare Pages app, click on the `Settings` tab and select `Environment variables` in the sidebar.
   1. Fill in `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` with the values you got from GitHub.
   1. You will also need to set `BASE_URL` to the URL that was given to you when you create the Cloudflare Pages app (e.g. `https://pages-cms-123.pages.dev`).
1. **Open the app link** (e.g. `https://pages-cms-123.pages.dev`).

Cloudflare has very generous free tiers and can also host your actual website. It's a great alternative to GitHub Pages, Netlify or Vercel.

## License

Everything in this repo is released under the [MIT License](LICENSE).
