# 📸 Cloudinary Image Upload Setup Guide

## Overview
Your inventory management system now supports automatic image uploads to Cloudinary with optimization, compression, and CDN delivery.

---

## 🎯 Features Implemented

✅ **Automatic Image Upload** - Upload images directly from your frontend
✅ **Image Optimization** - Auto-resize to 800x800px max, quality optimization
✅ **Format Conversion** - Automatic WebP conversion for smaller file sizes
✅ **CDN Delivery** - Fast image loading worldwide via Cloudinary CDN
✅ **Image Deletion** - Delete old images from Cloudinary
✅ **WhatsApp Integration** - Images automatically display in WhatsApp bot

---

## 📋 Step 1: Create Cloudinary Account

### 1. Sign Up (FREE)
1. Go to https://cloudinary.com
2. Click "Sign Up for Free"
3. Free tier includes:
   - 25 GB storage
   - 25 GB bandwidth/month
   - 25,000 transformations/month
   - Plenty for your inventory system!

### 2. Get Your Credentials
1. After signup, go to: https://console.cloudinary.com/console
2. You'll see your dashboard with:
   - **Cloud Name** (e.g., `dmxyz1234`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdef123456789_xyz`)

---

## ⚙️ Step 2: Configure Environment Variables

### Update your `.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

**Example (with real values):**
```env
CLOUDINARY_CLOUD_NAME=dmxyz1234
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdef123456789_xyz
```

### Restart your application:
```bash
# The app will reload automatically if you're using npm run start:dev
# Otherwise, restart manually
```

---

## 🚀 API Endpoints

### 1. Upload Image for Existing Item

**Endpoint:** `POST /items/:id/upload-image`

**Example using cURL:**
```bash
curl -X POST http://localhost:3000/items/1/upload-image \
  -F "image=@/path/to/your/image.jpg"
```

**Example using Postman:**
1. Select POST method
2. URL: `http://localhost:3000/items/1/upload-image`
3. Body → form-data
4. Key: `image` (change type to "File")
5. Value: Select your image file
6. Click Send

**Response:**
```json
{
  "message": "Image uploaded successfully",
  "imageUrl": "https://res.cloudinary.com/dmxyz1234/image/upload/v1234567890/inventory/products/abc123.jpg",
  "item": {
    "id": 1,
    "name": "Product Name",
    "imageUrl": "https://res.cloudinary.com/dmxyz1234/...",
    ...
  }
}
```

**Validations:**
- ✅ File types: JPEG, JPG, PNG, WebP
- ✅ Max size: 5MB
- ❌ Other formats rejected

---

### 2. Delete Image

**Endpoint:** `DELETE /items/:id/delete-image`

```bash
curl -X DELETE http://localhost:3000/items/1/delete-image
```

**Response:**
```json
{
  "message": "Image deleted successfully",
  "item": {
    "id": 1,
    "imageUrl": null,
    ...
  }
}
```

---

### 3. Update Image URL (Manual)

**Endpoint:** `PUT /items/:id/image`

```bash
curl -X PUT http://localhost:3000/items/1/image \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://example.com/image.jpg"}'
```

---

## 💻 Frontend Integration

### React/TypeScript Example

```typescript
// Upload image for a product
const uploadProductImage = async (itemId: number, file: File) => {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(`http://localhost:3000/items/${itemId}/upload-image`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    console.log('Upload successful:', data.imageUrl);
    return data;
  } catch (error) {
    console.error('Upload failed:', error);
  }
};

// Usage in a component
const ProductImageUpload = ({ itemId }: { itemId: number }) => {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Only JPEG, PNG, and WebP images are allowed');
      return;
    }

    await uploadProductImage(itemId, file);
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
      />
    </div>
  );
};
```

### HTML Form Example

```html
<form action="http://localhost:3000/items/1/upload-image" method="POST" enctype="multipart/form-data">
  <input type="file" name="image" accept="image/*" required>
  <button type="submit">Upload Image</button>
</form>
```

---

## 📱 WhatsApp Integration

Images are **automatically displayed** in WhatsApp when:
- Customer browses products
- Customer uses quick order links
- Product has `imageUrl` set

**Example WhatsApp Flow:**
1. Customer sends "menu"
2. Selects category
3. Selects product
4. 📸 **Image appears with product details**
5. Customer enters quantity and orders

---

## 🔧 Image Optimization

Images are automatically optimized by Cloudinary:

### Transformations Applied:
```javascript
{
  width: 800,
  height: 800,
  crop: 'limit',          // Don't upscale, only downscale if larger
  quality: 'auto:good',   // Automatic quality optimization
  fetch_format: 'auto',   // WebP for modern browsers, JPEG fallback
}
```

### What This Means:
- 🖼️ Max dimensions: 800x800px (perfect for WhatsApp)
- 📉 File size reduced by 50-80%
- ⚡ Fast loading on mobile networks
- 🌍 Served from nearest CDN location

---

## 📊 Cloudinary Dashboard

Monitor your usage at: https://console.cloudinary.com/console

**Key Metrics:**
- Storage used
- Bandwidth used
- Transformations count
- Credits remaining

**View All Images:**
- Media Library: https://console.cloudinary.com/console/media_library
- Folder: `inventory/products/`

---

## 🧪 Testing

### Test Upload

```bash
# Replace with your item ID and image path
curl -X POST http://localhost:3000/items/1/upload-image \
  -F "image=@product.jpg"
```

### Test in WhatsApp

1. Upload an image to a product
2. Send "menu" to your WhatsApp bot
3. Browse to that product
4. You should see the image! 📸

---

## ❓ Troubleshooting

### Error: "Cloudinary credentials missing"
- ✅ Check `.env` file has correct values
- ✅ Restart your application
- ✅ Verify credentials at https://console.cloudinary.com/console

### Error: "File too large"
- Max size: 5MB
- Compress image before uploading
- Use tools like TinyPNG or Squoosh

### Error: "Invalid file type"
- Only JPEG, PNG, WebP allowed
- Convert other formats first

### Image not showing in WhatsApp
- ✅ Check image URL is publicly accessible
- ✅ Test URL in browser
- ✅ Cloudinary URLs start with `https://res.cloudinary.com/`

---

## 🎉 Summary

You now have:
- ✅ Cloud image storage (Cloudinary)
- ✅ File upload API
- ✅ Automatic optimization
- ✅ WhatsApp image display
- ✅ CDN delivery
- ✅ 25GB free storage

**Next Steps:**
1. Create Cloudinary account
2. Add credentials to `.env`
3. Test upload via Postman
4. Integrate with frontend
5. Upload product images
6. Test in WhatsApp bot

🎯 Your customers will love seeing product images before ordering!
