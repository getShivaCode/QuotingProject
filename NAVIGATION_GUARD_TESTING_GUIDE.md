# Navigation Guard Testing Guide

## Quick Start

### Build & Run
```bash
cd packages/presentation
npm run build  # Verify compilation (already done, no errors)
npm start      # Start dev server on localhost:3000
```

### Manual Testing Steps

#### Test 1: Verify No Guard on Other Slides
1. Open browser to http://localhost:3000
2. Press Arrow Right multiple times to navigate slides 1-7
3. **Expected:** Navigation works smoothly, no modals appear ✅

#### Test 2: Navigate to Slide 8 Without Session
1. Navigate to Slide 8 (Try It Live) using arrow keys
2. Press Arrow Right (should attempt to stay, button disabled)
3. Press Arrow Left (should go to Slide 7)
4. **Expected:** Navigation works without modals ✅

#### Test 3: Start Session and Trigger Guard with Arrow Right
1. On Slide 8, click "Login with Salesforce"
2. Wait for session to start (LIVE badge appears)
3. Press Arrow Right
4. **Expected:** 
   - Modal appears: "Active Chat Session"
   - "Stay" and "Leave" buttons visible ✅

#### Test 4: Stay Button (Dismiss Modal)
1. From Test 3, modal is open
2. Click "Stay" button
3. **Expected:**
   - Modal disappears
   - Still on Slide 8
   - Session continues ✅

#### Test 5: Leave Button (Navigate Away)
1. On Slide 8 with active session
2. Press Arrow Right
3. When modal appears, click "Leave"
4. **Expected:**
   - Navigate to Slide 9 (or next valid slide)
   - Modal closes
   - Navigation complete ✅

#### Test 6: Arrow Left Navigation with Session
1. Start new session on Slide 8
2. Press Arrow Left
3. When modal appears, click "Leave"
4. **Expected:** Navigate to Slide 7 ✅

#### Test 7: Breadcrumb Navigation with Session
1. On Slide 8 with active session
2. Click breadcrumb for Slide 1
3. **Expected:** Modal appears ✅

#### Test 8: Breadcrumb "Leave" (Navigate to Earlier Slide)
1. From Test 7, modal is open
2. Click "Leave"
3. **Expected:** Navigate to Slide 1 ✅

#### Test 9: Nav Button with Session
1. On Slide 8 with active session
2. Click left arrow (chevron) button
3. **Expected:** Modal appears ✅

#### Test 10: Modal Background Click (Dismiss)
1. On Slide 8 with active session
2. Press Arrow Right (modal opens)
3. Click on the dark background/overlay area
4. **Expected:** Modal closes without navigating ✅

#### Test 11: Session Clear on Logout
1. On Slide 8 with active session
2. Click the logout button (⬅️ icon)
3. Session ends, "LIVE" badge disappears
4. Press Arrow Right
5. **Expected:** Navigation works normally, no modal ✅

#### Test 12: Session Clear on New Session
1. On Slide 8 with active session
2. Click the refresh/new session button (⟳ icon)
3. Wait for new session to start
4. Press Arrow Left
5. **Expected:** Modal appears (new session is active) ✅

#### Test 13: Dark Mode Toggle
1. Start a session on Slide 8
2. Click theme toggle (sun/moon icon in header)
3. Trigger navigation modal
4. **Expected:** Modal appears with dark mode styling ✅

#### Test 14: Arrow Down to Hidden Slide with Session
1. On Slide 8 with active session
2. Press Arrow Down (attempts to go to hidden slide)
3. **Expected:** Modal appears ✅

#### Test 15: Arrow Up from Hidden Slide (No Guard)
1. Navigate to hidden slide (Slide 10) without session
2. Start session (should work)
3. Press Arrow Up
4. **Expected:** Goes back to Slide 8, no modal (guard only on Slide 8 nav away) ✅

## Edge Cases

### Test E1: Rapid Navigation Attempts
1. On Slide 8 with active session
2. Press Arrow Right rapidly multiple times
3. **Expected:** Modal appears once, multiple key presses don't stack modals ✅

### Test E2: Navigate While Modal Open
1. Modal is open on Slide 8
2. Press Arrow Key
3. **Expected:** Nothing happens (modal has focus) ✅

### Test E3: Session Timeout
1. Start session, let it run for extended period
2. Try to navigate
3. **Expected:** If session expires on backend, modal still prevents navigation ✅

### Test E4: Multiple Sessions
1. Start session on Slide 8
2. Click new session button (⟳)
3. Immediately try to navigate before new session loads
4. **Expected:** Old session still blocks navigation ✅

## Verification Checklist

- [ ] No TypeScript errors in build
- [ ] Modal appears for all navigation methods when session active on Slide 8
- [ ] Modal only appears when on Slide 8 with active session
- [ ] "Stay" button dismisses modal
- [ ] "Leave" button navigates to pending slide
- [ ] Clicking outside modal dismisses it
- [ ] Navigation works normally without session
- [ ] Navigation works normally on other slides
- [ ] Session state correctly clears on logout
- [ ] Dark mode styling works for modal
- [ ] Modal animations are smooth
- [ ] No console errors during testing

## Debugging Tips

### Check Session Context
Open browser DevTools → Console and check:
```javascript
// These should be in React DevTools or logged to console
// Session should be null when no session, or sessionId string when active
```

### Check Modal State
The modal div has class `.modal-overlay` and `.modal-content` which should only exist in DOM when:
- `showNavConfirmation === true`
- On Slide 8 AND trying to navigate

### Check Navigation Handler
In `Presentation.tsx`, the `hasActiveSession` variable:
```javascript
const hasActiveSession = !!sessionId && isSlide8;
```
This controls whether navigation triggers the modal.

## Performance Notes

- Session context is minimal (~1 string or null)
- Modal only renders when `showNavConfirmation` is true
- No performance impact when modal not visible
- Framer Motion animations are GPU-accelerated
- CSS backdrop filter may impact performance on low-end devices

## Browser Compatibility

Tested features:
- CSS: backdrop-filter (Chrome, Firefox, Safari, Edge)
- React: All modern browsers
- Keyboard events: All modern browsers
- CSS Grid/Flexbox: All modern browsers

Falls back gracefully on older browsers (modal displays without blur effect).
