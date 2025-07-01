# Drag & Drop Image Uploader

A modern, accessible, and responsive web application for uploading, previewing, and managing images with a beautiful UI. Built with vanilla JavaScript and Tailwind CSS, it features drag-and-drop uploads, live previews, progress simulation, a persistent gallery, and dark mode.

## Features

- **Drag & Drop Upload**: Effortlessly upload images by dragging them into the drop zone or by browsing files.
- **Live Image Preview**: Instantly preview selected images before uploading. Remove images before upload with a hover delete button.
- **Progress Bar & Stats**: Simulated upload progress with speed and time estimates.
- **Gallery Side Panel**: View, group, and manage all uploaded images in a persistent gallery. Delete individual images (hover to reveal delete), delete entire batches (always visible button), or clear all with confirmation.
- **Delete Confirmation Dialog**: Deleting all images prompts a modal dialog that remains visible until you confirm or cancel.
- **Accessibility**: Keyboard navigation, ARIA roles, focus management, and screen reader support.
- **Dark Mode**: Toggle between light and dark themes, with system preference detection.
- **Persistent Storage**: Uploaded images and groups are saved in localStorage for session persistence.
- **Responsive Design**: Fully responsive layout and touch-friendly controls for mobile and desktop.
- **Custom Animations**: Smooth transitions, feedback, and micro-interactions for a delightful UX.
- **Error Handling**: User-friendly error messages for invalid files, oversized uploads, and more.

## Demo

![Demo Screenshot](assets/icons/og-image.png)

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, Safari)
- No build tools or backend required

### Installation

1. **Clone or Download the Repository**
   ```sh
   git clone <your-repo-url>
   cd drag-and-drop
   ```

2. **Open `index.html` in your browser**
   - No server required; just double-click or use `Live Server` in VS Code.

### File Structure

```
drag-and-drop/
  ├── assets/
  │   └── icons/           # App icons and Open Graph image
  ├── css/
  │   └── styles.css       # Custom styles and Tailwind overrides
  ├── js/
  │   ├── main.js          # App initialization and theme management
  │   ├── uploader.js      # Drag & drop logic, preview, progress, validation
  │   └── sidePanel.js     # Gallery, localStorage, and image group management
  ├── index.html           # Main HTML file
  └── src/                 # (empty, for future use)
```

## Usage

1. **Upload Images**
   - Drag images (JPG, PNG, GIF, max 5MB each) into the drop zone or click to select.
   - Preview images, see file count and total size.
   - Remove images before upload by hovering and clicking the delete icon.
   - Click "Upload Images" to simulate upload (no server required).

2. **Manage Gallery**
   - Uploaded images appear in the side panel, grouped by upload session.
   - Delete individual images (hover to reveal delete), delete entire groups (always visible button), or all uploads (with confirmation dialog).
   - Gallery persists across page reloads (localStorage).

3. **Delete Confirmation Dialog**
   - When deleting all images, a modal dialog appears and remains visible until you confirm or cancel.
   - The background is blurred and buttons are always accessible.

4. **Accessibility & Keyboard Shortcuts**
   - Tab/Shift+Tab to navigate.
   - Enter/Space to activate buttons.
   - `Ctrl+U` or `Cmd+U` to focus the upload area.
   - `Escape` to close dialogs.

5. **Theme**
   - Toggle dark/light mode using the sun/moon button in the header.
   - Respects system theme preference.

## Customization

- **Max File Size & Types**: Change in `js/uploader.js` (`maxFileSize`, `allowedTypes`).
- **Styling**: Modify `css/styles.css` or extend Tailwind config in `index.html`.
- **Animations**: Tweak or add keyframes in the CSS or Tailwind config.

## Accessibility

- Uses ARIA roles, labels, and live regions.
- Focus indicators and skip links for keyboard users.
- High contrast and reduced motion support.
- Dialogs trap focus and are accessible until dismissed.

## Technical Details

- **No frameworks**: Pure JavaScript, HTML, and CSS (Tailwind).
- **No backend**: All uploads are simulated and stored in browser localStorage.
- **Persistent gallery**: Images are converted to base64 and restored as File objects.
- **Mobile support**: Touch interactions and responsive layouts.

## Limitations

- **No real file upload**: This is a front-end demo; files are not sent to a server.
- **Browser storage limits**: Large or many images may exceed localStorage capacity.
- **Security**: Only image files are accepted; validation is enforced client-side.

## Deployment

- The project is ready for deployment as a static site.
- All assets are local; no build step is required.
- For best results, serve over HTTPS and set proper cache headers.
- Optionally, use a static host (Netlify, Vercel, GitHub Pages, etc.).

## Troubleshooting

- **Dialog not visible or interactive**: Ensure you are using a modern browser and have not disabled JavaScript or CSS.
- **Images not persisting**: Check browser localStorage settings and quota.
- **Performance issues**: Avoid uploading very large or many images at once; browser storage is limited.
- **Accessibility**: Use keyboard navigation and screen reader tools to verify accessibility features.

## Credits

- UI inspired by modern design systems and accessibility best practices.
- Built with [Tailwind CSS](https://tailwindcss.com/).