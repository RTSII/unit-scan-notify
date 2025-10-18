-- Test query to check violation photos
SELECT 
  vf.id,
  vf.unit_number,
  vf.occurred_at,
  vp.storage_path,
  vp.created_at
FROM violation_forms vf
LEFT JOIN violation_photos vp ON vp.violation_id = vf.id
ORDER BY vf.created_at DESC
LIMIT 10;
