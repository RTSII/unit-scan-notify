---
description: Photo Storage Implementation
auto_execution_mode: 3
---

Name: SPR Vice City - Photo Upload/Display
Trigger: When implementing photo features

Steps:
1. Use client-side compression (1600px, JPEG 80%)
2. Upload to Supabase Storage violation-photos bucket
3. Generate unique filename: {user_id}/{timestamp}.jpg
4. Store path in violation_photos.storage_path
5. Display using supabase.storage.getPublicUrl(path)
6. Never store base64 or full URLs in database
7. Test upload and display on mobile
8. Verify file in Supabase Storage dashboard