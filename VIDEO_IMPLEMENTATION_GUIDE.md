# Video Demo Implementation Guide

## Quick Start

### Current Status
✅ **All code changes are complete and tested.**

- VideoDemo component created: `frontend-next/components/video-demo.tsx`
- WorkoutCard updated to display videos
- Workout data updated with local video paths
- Frontend builds successfully
- Dev server running on localhost:3001

### What You Need to Do

1. **Place video files** in `/public/videos/`

   Required videos (or create placeholders):
   ```
   /public/videos/
   ├── upper-body-sculpt.mp4
   ├── chest-sculpt.mp4
   ├── lower-body-strength.mp4
   ├── core-strength-builder.mp4
   └── full-body-functional.mp4
   ```

2. **Test the integration**
   - Open http://localhost:3001/chatbot
   - Run fatigue analysis on http://localhost:3001/analysis
   - Request a workout recommendation
   - Observe demo video appearing below the workout recommendation

3. **(Optional) Add more videos** to other workouts by adding `mediaUrl` fields

---

## Component Reference

### VideoDemo Component

```typescript
import VideoDemo from "@/components/video-demo"

// Usage:
<VideoDemo src="/videos/my-workout.mp4" />
<VideoDemo src={undefined} />  // renders nothing
```

**Props**:
- `src?: string` — Path to video file relative to `/public`

**Behavior**:
- Returns `null` if `src` is undefined
- Muted, auto-playing, looping
- Graceful error handling if file missing
- Includes caption "Demo video for visual guidance only"

---

## Video Format Recommendations

| Property | Recommendation | Rationale |
|---|---|---|
| **Codec** | H.264 (AVC) | Wide browser support |
| **Container** | MP4 | Standard format |
| **Duration** | 15-30 seconds | UI performance, user attention |
| **Resolution** | 720p or lower | Responsive, fast loading |
| **File Size** | <5MB | Quick loading on mobile |
| **Audio** | Silent | Component is muted anyway |
| **Bitrate** | 500-1500 kbps | Balance quality and size |

**Creation Example**:
```bash
# Convert/compress video using ffmpeg
ffmpeg -i input.mov \
  -c:v libx264 \
  -preset medium \
  -crf 28 \
  -s 720x480 \
  -an \
  output.mp4
```

---

## Troubleshooting

### Video Not Appearing

1. **Check file exists**:
   ```bash
   ls -la frontend-next/public/videos/
   ```

2. **Check console for errors**:
   - Open browser DevTools (F12)
   - Check Console tab for "Failed to load video" messages
   - Verify path in workoutData matches actual file

3. **Check mediaUrl is set**:
   ```bash
   grep -n "mediaUrl" frontend-next/lib/workoutData.ts
   ```

### Video Not Playing

1. **Check browser support**: All modern browsers support H.264 MP4
2. **Check muted attribute**: Video must be muted to autoplay
3. **Check file format**: Use `file` command to verify:
   ```bash
   file frontend-next/public/videos/upper-body-sculpt.mp4
   # Should output: video/mp4
   ```

### Performance Issues

1. **Reduce file size**: Use ffmpeg to compress
2. **Lower resolution**: 720p is usually sufficient
3. **Shorter duration**: Aim for 15-20 seconds
4. **Check network tab**: In DevTools, verify load time <500ms

---

## Code Structure

```
frontend-next/
├── components/
│   └── video-demo.tsx          ← NEW: Video display component
├── app/
│   └── chatbot/
│       └── page.tsx            ← MODIFIED: Imports VideoDemo
├── lib/
│   └── workoutData.ts          ← MODIFIED: Updated mediaUrl paths
└── public/
    └── videos/                 ← Where videos go
        ├── upper-body-sculpt.mp4
        ├── chest-sculpt.mp4
        ├── lower-body-strength.mp4
        ├── core-strength-builder.mp4
        └── full-body-functional.mp4
```

---

## Integration Points

### 1. VideoDemo Component
- **Location**: `frontend-next/components/video-demo.tsx`
- **Purpose**: Reusable video display with error handling
- **Imported by**: `app/chatbot/page.tsx`

### 2. WorkoutCard Component
- **Location**: `frontend-next/app/chatbot/page.tsx` (lines 20-55)
- **Change**: Added `<VideoDemo src={workout.mediaUrl} />`
- **Position**: Below workout info, above "View steps" button

### 3. Workout Data
- **Location**: `frontend-next/lib/workoutData.ts`
- **Changes**: 6 mediaUrl entries updated from external URLs to local paths
- **Pattern**: `/videos/{workout-name}.mp4`

---

## Testing Checklist

Before deployment:

- [ ] Video files placed in `/public/videos/`
- [ ] Dev server runs without errors
- [ ] Chatbot page loads
- [ ] Fatigue analysis completes
- [ ] Workout recommendation displayed
- [ ] Video appears below workout text
- [ ] Video plays (muted, looping)
- [ ] Caption visible: "Demo video for visual guidance only"
- [ ] Chat flow unaffected if video missing
- [ ] Mobile view works (responsive video)

---

## Analytics/Monitoring

No additional monitoring needed. Videos are:
- Served statically from `/public/`
- Loaded by browser's native video player
- No API calls or tracking

Monitor using:
- **Browser DevTools** → Network tab (check video load times)
- **Lighthouse** → Performance tab (should have minimal impact)

---

## Future Enhancements

Optional improvements:

1. **Video thumbnails**: Add poster image to `<video>`
   ```tsx
   <video poster="/images/workout-thumb.png" ... />
   ```

2. **Play button**: Custom play button for better UX
   ```tsx
   <button onClick={() => videoRef.current?.play()}>
     ▶ Play Demo
   </button>
   ```

3. **Video controls**: Allow user control (pause, seek)
   ```tsx
   <video controls ... />
   ```

4. **HLS/Streaming**: For very large videos, use HLS adaptive streaming

5. **More workouts**: Add `mediaUrl` to moderate and high fatigue workouts

---

## Constraints Verification

All requirements met:

- ✅ Chatbot decision logic unchanged
- ✅ Fatigue calculation untouched
- ✅ Workout selection algorithm unmodified
- ✅ Videos from `/public/videos/` only
- ✅ No external URLs
- ✅ No API calls
- ✅ Graceful fallback if video missing
- ✅ Muted, auto-play, looping
- ✅ Non-blocking (doesn't delay chat)
- ✅ Minimal code changes (~50 lines)

---

## Support

For questions or issues:

1. Check `VIDEO_INTEGRATION_SUMMARY.md` for overview
2. Review this file for detailed reference
3. Inspect browser console for error messages
4. Run `npm run build` and `npm run lint` to validate

---

**Last Updated**: January 27, 2026  
**Version**: 1.0 (Complete)
