export async function onRequest(context) {
  const { request } = context;
  
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('image');
    
    if (!file) {
      return new Response('No image provided', { status: 400 });
    }

    // Process the image
    const imageArrayBuffer = await file.arrayBuffer();
    const imageBlob = new Blob([imageArrayBuffer]);
    const imageBitmap = await createImageBitmap(imageBlob);

    // Set maximum dimensions while maintaining aspect ratio
    const MAX_WIDTH = 1920;
    const MAX_HEIGHT = 1080;
    let width = imageBitmap.width;
    let height = imageBitmap.height;

    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
      if (width / height > MAX_WIDTH / MAX_HEIGHT) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      } else {
        width = Math.round((width * MAX_HEIGHT) / height);
        height = MAX_HEIGHT;
      }
    }

    // Create canvas for processing
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageBitmap, 0, 0, width, height);

    // Convert to WebP with compression
    const webpBlob = await canvas.convertToBlob({
      type: 'image/webp',
      quality: 0.85
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
