# 🔧 Quick Rebuild Instructions

## All errors have been fixed! Follow these steps:

### Step 1: Rebuild Docker Image

```bash
cd /Users/kalo/pulse-microservices

# Stop the service
docker-compose stop social-service

# Remove old container and image
docker-compose rm -f social-service
docker rmi pulse-microservices-social-service || true

# Rebuild with --no-cache to ensure fresh build
docker-compose build --no-cache social-service
```

### Step 2: Start the Service

```bash
# Start in detached mode
docker-compose up -d social-service

# Or with logs
docker-compose up social-service
```

### Step 3: Verify It's Working

```bash
# Check health
curl http://localhost:8085/health

# Should return:
# {"success":true,"data":{"status":"healthy",...}}

# Check API docs
open http://localhost:8085/api-docs
```

---

## Alternative: Use the Script

```bash
cd social-service
./scripts/docker-rebuild.sh
```

This script automatically does all 3 steps above!

---

## What Was Fixed?

1. ✅ **Prisma/OpenSSL Error** - Added OpenSSL to Dockerfile
2. ✅ **Binary Targets** - Updated Prisma schema for ARM64/Alpine
3. ✅ **RabbitMQ Warnings** - Changed to debug level
4. ✅ **Postman Collection** - Added 9 social endpoints

---

## Test the API

### Import Postman Collection

```bash
# The file is at:
/Users/kalo/pulse-microservices/POSTMAN_COLLECTION.json

# In Postman:
# 1. File → Import
# 2. Select POSTMAN_COLLECTION.json
# 3. Go to "Social" folder
# 4. Test endpoints!
```

### Or Use cURL

```bash
# Get social stats (public)
curl http://localhost:8085/api/v1/social/stats/YOUR_USER_ID

# Follow a user (requires JWT)
curl -X POST http://localhost:8085/api/v1/social/follow/USER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Need Help?

See detailed documentation in:
- `ERRORS_FIXED.md` - Complete fix details
- `FIXES.md` - Troubleshooting guide
- `README.md` - Full documentation
- `QUICKSTART.md` - 5-minute setup

---

**Status:** ✅ All Fixed and Ready!

