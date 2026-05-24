
-- Replace deprecated source.unsplash.com URLs with curated working Unsplash photos.
-- We rotate across 12 photo IDs based on hashtext(slug) for variety.
WITH photos(idx, photo_id) AS (VALUES
  (0, 'photo-1541339907198-e08756dedf3f'),
  (1, 'photo-1523050854058-8df90110c9f1'),
  (2, 'photo-1562774053-701939374585'),
  (3, 'photo-1571260899304-425eee4c7efc'),
  (4, 'photo-1607237138185-eedd9c632b0b'),
  (5, 'photo-1592280771190-3e2e4d571952'),
  (6, 'photo-1498243691581-b145c3f54a5a'),
  (7, 'photo-1607013251379-e6eecfffe234'),
  (8, 'photo-1576495199026-0a4f1ccb7d6c'),
  (9, 'photo-1583468982228-19f19164aee2'),
  (10, 'photo-1568667256549-094345857637'),
  (11, 'photo-1519452575417-564c1401ecc0')
)
UPDATE public.universities_detail u
SET campus_image_url = 'https://images.unsplash.com/' || p.photo_id || '?w=1600&q=80&auto=format&fit=crop'
FROM photos p
WHERE (abs(hashtext(u.slug)) % 12) = p.idx
  AND (u.campus_image_url IS NULL OR u.campus_image_url LIKE '%source.unsplash%');
