export async function onRequest(context) {
  const { request } = context;
  
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('image');
    const configStr = formData.get('config');
    
    if (!file) {
      return new Response('No image provided', { status: 400 });
    }

    // Parse config if provided, otherwise use defaults
    const config = configStr ? JSON.parse(configStr) : {};
    const optimize = config?.media?.optimize || {
      enabled: true,
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.85
    };

    // If optimization is disabled, return original file
    if (!optimize.enabled) {
      return new Response(file, {
        headers: {
          'Content-Type': file.type,
          'Content-Disposition': `attachment; filename="${file.name}"`,
        },
      });
    }

    // Process the image
    const imageArrayBuffer = await file.arrayBuffer();
    const imageBlob = new Blob([imageArrayBuffer]);
    const imageBitmap = await createImageBitmap(imageBlob);

    // Set maximum dimensions while maintaining aspect ratio
    let width = imageBitmap.width;
    let height = imageBitmap.height;

    if (width > optimize.maxWidth || height > optimize.maxHeight) {
      if (width / height > optimize.maxWidth / optimize.maxHeight) {
        height = Math.round((height * optimize.maxWidth) / width);
        width = optimize.maxWidth;
      } else {
        width = Math.round((width * optimize.maxHeight) / height);
        height = optimize.maxHeight;
      }
    }

    // Create canvas for processing
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageBitmap, 0, 0, width, height);

    // Convert to WebP with compression
    const webpBlob = await canvas.convertToBlob({
      type: 'image/webp',
      quality: optimize.quality
    });

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name.replace(/\.[^/.]+$/, '')}.webp`;

    // Return the processed image
    return new Response(webpBlob, {
      headers: {
        'Content-Type': 'image/webp',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
