# Drag & Drop Image Uploader

A modern, accessible, and responsive web application for uploading, previewing, and managing images with a beautiful UI. Built with vanilla JavaScript and Tailwind CSS, it features drag-and-drop uploads, live previews, progress simulation, a persistent gallery, and dark mode.

## Features

- **Drag & Drop Upload**: Effortlessly upload images by dragging them into the drop zone or by browsing files.
- **Live Image Preview**: Instantly preview selected images before uploading.
- **Progress Bar & Stats**: Simulated upload progress with speed and time estimates.
- **Gallery Side Panel**: View, group, and manage all uploaded images in a persistent gallery.
- **Delete & Undo**: Remove individual images, groups, or all uploads with confirmation dialogs.
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
   - Click "Upload Images" to simulate upload (no server required).

2. **Manage Gallery**
   - Uploaded images appear in the side panel, grouped by upload session.
   - Delete individual images, entire groups, or all uploads (with confirmation).
   - Gallery persists across page reloads (localStorage).

3. **Accessibility & Keyboard Shortcuts**
   - Tab/Shift+Tab to navigate.
   - Enter/Space to activate buttons.
   - `Ctrl+U` or `Cmd+U` to focus the upload area.
   - `Escape` to close dialogs.

4. **Theme**
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

## Technical Details

- **No frameworks**: Pure JavaScript, HTML, and CSS (Tailwind).
- **No backend**: All uploads are simulated and stored in browser localStorage.
- **Persistent gallery**: Images are converted to base64 and restored as File objects.
- **Mobile support**: Touch interactions and responsive layouts.

## Limitations

- **No real file upload**: This is a front-end demo; files are not sent to a server.
- **Browser storage limits**: Large or many images may exceed localStorage capacity.
- **Security**: Only image files are accepted; validation is enforced client-side.

## Credits

- UI inspired by modern design systems and accessibility best practices.
- Built with [Tailwind CSS](https://tailwindcss.com/).