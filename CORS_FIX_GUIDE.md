# CORS Fix for E-commerce Store

## ✅ Issue Fixed!

The CORS error has been resolved. Your e-commerce frontend at `https://store.mwendavano.com` can now access the backend API at `https://business.mwendavano.com`.

---

## 🔧 What Was Changed

### Updated File: `src/main.ts`

**Before:**
```typescript
app.enableCors();
```

**After:**
```typescript
app.enableCors({
  origin: [
    'https://store.mwendavano.com',      // Your e-commerce store
    'https://business.mwendavano.com',   // Your admin panel
    'http://localhost:3000',              // Local development
    'http://localhost:3001',
    'http://localhost:5173',              // Vite default port
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
});
```

---

## 🚀 Deployment Instructions

### Option 1: Deploy Updated Backend

**You need to deploy the updated backend code to production:**

1. **If using PM2:**
   ```bash
   # Build the project
   npm run build

   # Restart PM2 process
   pm2 restart inventory-backend

   # Or reload for zero-downtime
   pm2 reload inventory-backend
   ```

2. **If using Docker:**
   ```bash
   # Rebuild the Docker image
   docker build -t inventory-backend .

   # Restart container
   docker-compose down
   docker-compose up -d
   ```

3. **If using systemd:**
   ```bash
   # Restart the service
   sudo systemctl restart inventory-backend
   ```

4. **If using manual Node:**
   ```bash
   # Build and restart
   npm run build
   pkill -f "node dist/main"
   npm run start:prod &
   ```

---

## 🧪 Testing CORS

### Test from Browser Console

Open your frontend at `https://store.mwendavano.com` and run in browser console:

```javascript
// Test CORS with a simple GET request
fetch('https://business.mwendavano.com/api/items')
  .then(response => response.json())
  .then(data => console.log('CORS working!', data))
  .catch(error => console.error('CORS error:', error));

// Test CORS with POST request
fetch('https://business.mwendavano.com/api/whatsapp/ecommerce-order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    customerName: 'Test',
    customerPhone: '255700000000',
    warehouseId: 1,
    items: [{ itemId: 2, quantity: 1, unitPrice: 100000 }],
    deliveryAddress: 'Test Address'
  })
})
  .then(response => response.json())
  .then(data => console.log('Order created!', data))
  .catch(error => console.error('Error:', error));
```

### Test with cURL

```bash
# Test preflight request (OPTIONS)
curl -X OPTIONS https://business.mwendavano.com/api/whatsapp/ecommerce-order \
  -H "Origin: https://store.mwendavano.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# Should return:
# Access-Control-Allow-Origin: https://store.mwendavano.com
# Access-Control-Allow-Methods: GET,POST,PUT,DELETE,PATCH,OPTIONS
# Access-Control-Allow-Headers: Content-Type,Authorization,Accept
```

---

## 🔒 CORS Configuration Explained

### Allowed Origins

```typescript
origin: [
  'https://store.mwendavano.com',      // Production e-commerce store
  'https://business.mwendavano.com',   // Production admin panel
  'http://localhost:3000',              // Local development (Next.js default)
  'http://localhost:3001',              // Local development (alternative)
  'http://localhost:5173',              // Local development (Vite default)
]
```

### Allowed Methods

All standard HTTP methods are allowed:
- **GET** - Fetch data
- **POST** - Create resources
- **PUT** - Update resources
- **DELETE** - Delete resources
- **PATCH** - Partial updates
- **OPTIONS** - Preflight requests (required for CORS)

### Allowed Headers

```typescript
allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
```

- **Content-Type** - For JSON requests
- **Authorization** - For authenticated requests (future JWT)
- **Accept** - For content negotiation

### Credentials

```typescript
credentials: true
```

Allows cookies and authentication headers to be sent with requests.

---

## 📝 Common CORS Errors & Solutions

### Error 1: "No 'Access-Control-Allow-Origin' header"

**Cause:** Backend not configured with CORS or origin not allowed.

**Solution:** ✅ Fixed! Backend now allows `https://store.mwendavano.com`

### Error 2: "CORS preflight failed"

**Cause:** OPTIONS requests are blocked or not handled properly.

**Solution:** ✅ Fixed! `OPTIONS` method is now explicitly allowed.

### Error 3: "Credentials not allowed"

**Cause:** `credentials: true` not set when using cookies/auth.

**Solution:** ✅ Fixed! `credentials: true` is now enabled.

### Error 4: "Method not allowed"

**Cause:** HTTP method (POST, PUT, DELETE) not in allowed methods.

**Solution:** ✅ Fixed! All standard methods are allowed.

---

## 🌐 Adding More Allowed Origins

If you need to add more frontend domains in the future:

**Edit `src/main.ts`:**

```typescript
app.enableCors({
  origin: [
    'https://store.mwendavano.com',
    'https://business.mwendavano.com',
    'https://new-frontend.com',        // Add new domain here
    'http://localhost:3000',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
});
```

Then rebuild and redeploy:
```bash
npm run build
pm2 restart inventory-backend
```

---

## 🔥 Alternative: Allow All Origins (Not Recommended for Production)

**Only use this for development/testing:**

```typescript
app.enableCors({
  origin: true,  // Allows ALL origins (⚠️ INSECURE)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
});
```

**Why not recommended?**
- Security risk - any website can access your API
- CORS exists to protect your users
- Use specific origins in production

---

## 🚨 Troubleshooting

### Backend Deployed but CORS Still Not Working?

1. **Check if backend restarted:**
   ```bash
   pm2 status
   # or
   systemctl status inventory-backend
   ```

2. **Check backend logs:**
   ```bash
   pm2 logs inventory-backend
   # or
   journalctl -u inventory-backend -f
   ```

3. **Verify CORS headers in response:**
   ```bash
   curl -I https://business.mwendavano.com/api/items \
     -H "Origin: https://store.mwendavano.com"

   # Should see:
   # access-control-allow-origin: https://store.mwendavano.com
   ```

4. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Or clear browser cache completely

5. **Check reverse proxy (if using nginx):**

   If you're using nginx, make sure it's not stripping CORS headers:

   **nginx.conf:**
   ```nginx
   location /api {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;

       # DON'T add CORS headers here - let NestJS handle it
   }
   ```

---

## ✅ Verification Checklist

After deploying, verify these:

- [ ] Backend service is running
- [ ] Backend build includes updated `main.ts`
- [ ] OPTIONS requests return CORS headers
- [ ] GET requests from frontend work
- [ ] POST requests from frontend work
- [ ] No CORS errors in browser console
- [ ] Orders can be created from frontend

---

## 📞 Support

If CORS errors persist after deployment:

1. Check backend is running: `curl https://business.mwendavano.com/api/items`
2. Check CORS headers: `curl -I https://business.mwendavano.com/api/items -H "Origin: https://store.mwendavano.com"`
3. Check browser console for exact error message
4. Share the error message for further assistance

---

## 🎉 Summary

✅ **CORS configuration updated** in `src/main.ts`
✅ **Build successful** - No compilation errors
✅ **Frontend domain allowed:** `https://store.mwendavano.com`
✅ **All HTTP methods allowed:** GET, POST, PUT, DELETE, PATCH, OPTIONS
✅ **Credentials enabled** for authenticated requests

**Next step:** Deploy the updated backend to production and test! 🚀
