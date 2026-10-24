# Website update guide

23 October 2026 · Current green Anybody/Manrope extension.

## Open the website and staff workspace

The local website is at [127.0.0.1:5174](http://127.0.0.1:5174), with its API on loopback port 4102. If stopped, run `npm run dev` from the project root; see [local setup](../README.md#run-on-this-computer). Keep both website and API running. Course loading and staff saves need the backend; a static website bundle alone cannot provide them.

| Page | Local link |
| --- | --- |
| Original homepage restored | [Homepage](http://127.0.0.1:5174/) |
| Four illustrated services | [What we do](http://127.0.0.1:5174/services) |
| Public course catalogue | [Team training](http://127.0.0.1:5174/training#courses) |
| Course editor | [Admin · Team training](http://127.0.0.1:5174/admin?section=training) |
| Nine image placements | [Admin · Site images](http://127.0.0.1:5174/admin?section=images) |

In admin, choose **Open local staff workspace** if prompted. This is loopback-only development access, with staff-session and CSRF checks; production authentication has not been completed. Local content is stored in the PGlite database under `.data/postgres`. Restarting preserves saved content but ends staff sessions. Run only one API process against this database.

## Update courses

The current topics are **Vibe Coding** and **Workflow Automation & AI Agents for Daily Work**. They are owner-supplied topics, not fictional placeholder courses. Their duration and delivery format remain **To be confirmed** until agreed. Do not invent course codes, dates, schedules or performance claims.

1. Select a course or **Add course**. Edit the title, who it is for, duration, delivery format, optional summary and plain-text outline. Outline line breaks appear publicly.
2. To keep a course private, choose **Visibility → Draft — private**, then **Save draft**. Saving an already published course as a draft removes it from the public catalogue.
3. To publish, choose **Published — on the website**, then **Save & publish**. This saves all fields together. Only published courses appear on `/training`, in the saved order; refresh or return to that page to check the result.
4. Use a course's **Move up/down** controls to change order. Each move saves immediately. Save or discard field edits before moving or archiving.
5. **Archive course** asks for confirmation and removes the course from the public catalogue while retaining its details. To restore, select it under **Archived**, choose **Draft** or **Published**, then save. Choosing **Archived** in Visibility and saving also archives a course.
6. **Discard changes** restores the last saved fields. Cancelling an unsaved-changes warning keeps your edits. Selection, navigation, reload and sign-out are protected; loading/saving feedback and empty/error states explain what is happening.

If a save fails, edits remain in the editor. A version conflict means another staff session changed the catalogue: copy anything needed, then deliberately use **Reload catalogue** to fetch the latest saved version before reapplying edits. Reload can discard unsaved work. If the staff session ends, copy edits before signing out and reopening the workspace.

## Replace an image or adjust its crop

Site images has **nine placements**: About workplace, About team photo, three team portraits, Training workshop and three technical services. The training workshop also illustrates the training row on `/services`; each technical service image appears both in that directory and prominently near the top of its detail page:

- [Technology consulting](http://127.0.0.1:5174/services/consulting)
- [Application development](http://127.0.0.1:5174/services/application-development)
- [AI agents & integration](http://127.0.0.1:5174/services/ai-agents-integration)

1. Select the placement, then **Choose a photo** for a replacement: JPG, PNG or WebP, up to 5 MB / 25 MP. The three generated service defaults are 1536 × 1024; replacement uploads need not match those dimensions.
2. Use **Adjust the crop → Horizontal / Vertical** to move the focal point. This changes framing rather than editing the original image. Technical service frames are 16:9; check both directory and detail-page crops, including on mobile.
3. Update **Image description** for screen readers and the optional **Caption**. Portrait placements also have team member name and role fields. Keep the AI-placeholder label for generated imagery; remove it only after supplying an appropriate genuine photo and updating its description. Fictional people must remain visibly identified as placeholders, not actual staff.
4. Choose **Publish changes** to save the image, crop and details. **Discard changes** returns unsaved edits to the saved version. **Restore AI placeholder** resets the placement after confirmation and removes its stored upload; publishing a replacement also overwrites the previous upload. Keep original files: there is no recoverable image history.

The three service defaults, prompts, dimensions and provenance are recorded in [service-images.json](service-images.json). Existing people/workshop defaults have their own [placeholder manifest](placeholder-images.json). Generated service scenes are illustrative concepts, not evidence of client work or deployments.

## Homepage restored

The original homepage was restored at `/` on 24 October 2026 after the updated version was rejected as too complicated.

The workflow experiment and public comparison controls are no longer live; `/home-original` is no longer a registered route. Experiment source files remain dormant for reference. The service imagery, course catalogue and staff editing instructions above are unchanged.

## Verification boundary

The [documentation handoff](../.impeccable/review/extension-2026-10-23-documentation.md) records the supplied runtime checks and evidence. The [independent finish review](../.impeccable/review/extension-2026-10-23-review.md) returned **ship** for this scoped local extension, with no material fixes. It was a file-only visual/source review, not an exhaustive backend review. No production deployment, push, hosting setup or production-authentication completion is claimed.
