/goal

Implement the Step 3 UI and functionality so that it advances the intended Review Studio experience, rather than merely applying isolated cosmetic fixes.

Before changing the implementation, inspect the following GitHub folder and all relevant subfolders and files:

https://github.com/ang-kl/2026-0313_AI-JS/tree/main/v3/design/Design%20layout%20improvement

Treat the folder contents, design references and supplied images as the visual and functional direction for Step 3.

Also inspect the current Step 3 specifications and implementation before making changes. Step 3 is intended to be a reviewable workspace shown after the user selects Analyse, with the manuscript remaining the primary source text and reviewer comments, visual intelligence and traceable findings supporting the review process. Do not redesign Step 3 as a generic dashboard or allow secondary panels to overwhelm the manuscript. 

The supplied reference images illustrate the intended experience, including:

- A manuscript or job-posting pane that remains visible and readable.
- Analytical panels arranged as a flexible workspace.
- Highlighted source phrases connected visually to the corresponding reviewer comment.
- A Reviewer Comments window that can appear above the workspace.
- Panels or windows that may overlap when intentionally opened, without destroying the underlying layout.
- Clear Accept and Reject review actions.
- Traceability between source text, analysis, reviewer comments and decisions.
- A professional visual hierarchy appropriate for an analytical review tool.

The images are design references, not instructions to reproduce every pixel literally. Preserve the existing project architecture, evidence rules, provenance, deterministic calculations and non-inventive analysis requirements.

The goal is to improve Step 3 while maintaining these core principles:

1. The original manuscript remains the primary evidence surface.
2. Analysis must be traceable to the exact source text.
3. Reviewer comments support human judgement rather than replace it.
4. AI-generated interpretation must be visibly distinguished from deterministic or source-derived information.
5. The interface must remain usable when panels are opened, moved, resized or overlapped.
6. Important information must never become unreadable because of low contrast, small typography, clipping, hidden overflow or competing layers.
7. Human review and acceptance remain explicit. AI assists; the human decides.

/task

Review Image #13, the two supplied Step 3 reference images, the GitHub design folder and the current Step 3 implementation. Implement all requirements below as one coherent UI correction.

Do not fix only the single visible example. Apply the relevant rules across the entire Step 3 interface and, where stated, across the global application design system.

## 1. Investigate the visible “API” element

Identify why an API-related element, label, endpoint reference or technical term appears in the user-facing interface shown in Image #13.

Determine whether it is:

- Intended user-facing information.
- An internal implementation label.
- Debug information.
- A development placeholder.
- A navigation or status element whose wording is unclear.

Then apply the appropriate correction:

- Remove it if it is internal, accidental, redundant or intended only for developers.
- Replace it with clear user-facing wording if the underlying function is legitimate.
- Retain it only when ordinary users genuinely need it and its purpose is immediately understandable.
- Do not leave unexplained engineering terminology in the production UI.

Document briefly in the implementation summary:

- Where the API element came from.
- Why it was retained, renamed or removed.
- Which component or source file was changed.

## 2. Enforce accessible text contrast throughout the UI

The following disclaimer is critical information and must remain fully readable:

“Indicative analysis - ESCO/ISCO mappings are derived from public taxonomy data plus model inference; treat scores as a guide, not a verdict.”

The current faint grey or light-black text on a white background is difficult or impossible for a user with red-green colour-vision deficiency to read.

Apply a global accessibility rule across the complete application, not only to this disclaimer.

### Mandatory contrast requirements

- Normal text must meet at least WCAG 2.2 AA contrast of 4.5:1.
- Large text must meet at least WCAG 2.2 AA contrast of 3:1.
- User-interface controls, meaningful borders, focus indicators and graphical objects must meet the relevant non-text contrast requirements.
- Do not use colours that are visually too close to their background.
- Do not use opacity to make important text faint.
- Do not communicate status, warning, confidence, approval, rejection, categorisation or differences through red and green alone.

These requirements apply to:

- Body text.
- Helper text.
- Captions.
- Disclaimers.
- Form labels.
- Placeholders.
- Disabled states.
- Confidence labels.
- Provenance labels.
- Tooltips.
- Panel headings.
- Table content.
- Chart labels.
- Graph labels.
- Reviewer comments.
- Footer content.
- Modal content.
- Toast messages.
- Empty states.
- Error and warning messages.
- Light mode and dark mode.
- Hover, focus, selected and inactive states.

Use text, icons, labels, line styles, shapes, patterns or other non-colour cues together with colour.

The Step 3 specification already expects colour-blind-safe highlight treatment and explicitly states that span styles should not depend on red-green distinctions. Preserve and extend this principle consistently. 

### Disclaimer treatment

The disclaimer must:

- Use normal readable text rather than faint secondary text.
- Remain visible without hover.
- Not be hidden inside a tooltip.
- Not be truncated.
- Wrap properly on narrow screens.
- Appear wherever the ESCO/ISCO or model-derived scores are presented.
- Be positioned close enough to the relevant result that users understand what it qualifies.
- Be accessible to screen readers.

## 3. Increase footer typography by 10%

Increase the computed footer font size by 10% from its present value.

Example:

- If the current value is 10 px, change it to 11 px.
- If the current value is 0.75 rem, change it to 0.825 rem.
- Do not simply add 10 percentage points without checking the computed result.

Also:

- Adjust line-height, spacing and padding so the footer does not become cramped.
- Preserve a clear hierarchy between footer headings and footer links.
- Ensure the footer remains readable at 200% browser zoom.
- Ensure it wraps cleanly on mobile.
- Prevent horizontal scrolling caused by footer content.
- Apply the same contrast rules to every footer item.

## 4. Consolidate www.takearoundabout.com information in the footer

Make the main site footer the consistent location for relevant www.takearoundabout.com information.

Include, where available:

- Builder or creator information.
- About the project.
- Methodology.
- Data sources.
- AI methodology or model-use explanation.
- Terms of use.
- Privacy information.
- Accessibility statement.
- Disclaimer.
- Contact or feedback channel.
- Version or build information, when appropriate.
- Copyright information.

Requirements:

- Use clear link labels rather than unexplained technical names.
- Do not expose internal file paths, API routes, environment names or implementation details.
- Avoid duplicating identical footer information elsewhere unless contextual disclosure is legally or functionally necessary.
- Keep critical contextual disclaimers near the result they qualify, even when a fuller version also exists in the footer.
- Ensure all footer links have visible keyboard-focus states.
- Ensure external links are identifiable and behave consistently.

## 5. Step 3 processing progress must use a centred modal

When Step 3 analysis begins, display progress in a modal dialog centred within the viewport.

Do not show the main Step 3 build progress only as an inline bar within the page.

### Modal behaviour

The progress modal must:

- Open immediately after the Step 3 analysis action is confirmed.
- Appear in the visual centre of the viewport.
- Use a proper dialog implementation.
- Include a visible title.
- Include a progress bar.
- Include a plain-language current-status message.
- Include an accessible numerical progress value when a genuine percentage is available.
- Use an indeterminate progress state when the system cannot reliably calculate completion.
- Prevent accidental interaction with the underlying workspace while the blocking operation is running.
- Trap keyboard focus within the dialog.
- Restore focus to the initiating control when the dialog closes.
- Be announced appropriately to assistive technologies.
- Work in light and dark modes.
- Fit within mobile viewports without clipping.
- Remain usable at 200% zoom.
- Close automatically only after Step 3 is ready to display.
- Show a clear failure state if processing fails.
- Provide Retry and Return actions after failure.
- Never display a fabricated percentage merely to simulate movement.

Suggested status wording may include:

- Preparing the posting.
- Extracting responsibilities.
- Mapping skills and occupations.
- Calculating the AI-exposure analysis.
- Preparing reviewer comments.
- Building the Step 3 review workspace.
- Finalising traceability links.

Use only statuses that correspond to actual system stages.

## 6. Preserve the Step 3 Review Studio purpose

Do not reduce Step 3 to a static report.

Step 3 must remain an interactive human-review workspace in which users can:

- Read the source posting.
- See highlighted evidence.
- Trace findings back to the exact source phrase.
- Review analytical panels.
- Open reviewer comments.
- Accept or reject review suggestions.
- Understand whether a finding is from the posting, computed, derived, model-inferred or unverified.
- Keep the source material visible while reviewing related analysis.

The current specification states that the reviewer voice is central to Step 3 and that Suggestions is the default review mode. Preserve this intent unless the repository design documents explicitly supersede it. 

## 7. Reviewer Comments window behaviour

Using the supplied reference images as the interaction guide, improve the Reviewer Comments panel so that it behaves like a controlled workspace window rather than an uncontrolled overlay.

### Required behaviour

- It may appear above analytical panels when opened.
- It must not permanently obscure essential manuscript content.
- It must stay within the visible viewport.
- Its title bar must remain reachable.
- Its close control must remain visible.
- Its internal content may scroll independently.
- The entire page must not jump when the panel opens.
- Opening it must not reset the user’s manuscript scroll position.
- It must have an appropriate maximum width and height.
- It must adapt to smaller screens as a slide-over or full-width modal.
- It must use a defined z-index layer from the design system rather than an arbitrary number.
- It must not appear behind the header, modal backdrop or other critical layers.
- Keyboard users must be able to reach the comments and action buttons.
- Screen-reader users must receive an appropriate panel name and state.

If dragging or resizing is already part of the architecture:

- Keep the panel within viewport boundaries.
- Provide sensible minimum and maximum dimensions.
- Preserve the last position only within the current session.
- Provide a Reset position action.
- Do not require dragging for basic use.

If dragging or resizing is not already supported, do not introduce a fragile dependency merely to imitate a desktop window. Use a stable anchored or floating panel.

## 8. Overlapping panel rules

The second supplied image demonstrates intentional window overlap. Implement overlap carefully.

- Overlap may be used to preserve context while viewing comments.
- The active panel must appear visually above inactive panels.
- The underlying content must remain recognisable.
- Overlap must not hide all navigation or prevent recovery.
- Clicking a permitted floating panel may bring it to the front.
- Modal dialogs must always remain above ordinary floating panels.
- Tooltips and menus must not become trapped behind panels.
- Avoid excessive shadows, transparency or blur that reduces readability.
- Do not allow multiple uncontrolled windows to cover the full workspace.

Define and document a layer hierarchy such as:

1. Base workspace.
2. Sticky navigation and ribbon.
3. Floating analytical panels.
4. Reviewer Comments panel.
5. Menus and tooltips.
6. Blocking modal and backdrop.
7. Critical system alerts.

Use the project’s existing layering system where one exists.

## 9. Source-to-comment traceability

Preserve and strengthen the visual connection between highlighted manuscript text and the corresponding reviewer comment.

When a user:

- Selects a highlighted source phrase.
- Hovers over it.
- Focuses it by keyboard.
- Selects the related reviewer comment.

The interface should clearly identify both ends of the relationship.

Requirements:

- Highlight the associated source phrase and comment card.
- Scroll the relevant item into view only when necessary.
- Avoid disorienting automatic scrolling.
- Use more than colour alone.
- Use a border, icon, connector, label or emphasis state.
- Connector lines must not cover text.
- Connector lines must update when panels move, resize or scroll.
- Hide or simplify connector lines on narrow screens where they would become confusing.
- Provide an accessible text alternative such as “Linked to highlighted duty 2”.
- Do not create a relationship unless the source span is genuinely traceable.

The Step 3 implementation must continue to use verbatim source spans and must not invent or paraphrase the underlying duty text. 

## 10. Accept and Reject actions

The Accept and Reject controls in reviewer comments must be accessible and unambiguous.

- Do not distinguish them only by green and red.
- Include explicit text labels.
- Give both controls clear focus states.
- Provide an accessible selected state after action.
- Prevent accidental duplicate submission.
- Show whether the decision has been saved.
- Allow reversal when the workflow permits it.
- Confirm destructive or irreversible rejection only when necessary.
- Maintain decision counts accurately.
- Do not imply that acceptance validates the entire analysis when it applies only to one comment.

## 11. Responsive behaviour

Test the revised UI at minimum at:

- 320 px width.
- 375 px width.
- 768 px width.
- 1024 px width.
- 1366 px width.
- 1440 px width.
- 1920 px width.
- 200% browser zoom.

For narrow screens:

- Keep the manuscript primary.
- Convert floating panels into safe slide-over or full-screen surfaces.
- Avoid horizontal page scrolling.
- Keep close and back controls visible.
- Preserve readable font sizes.
- Do not squeeze desktop multi-panel layouts into an unusable miniature form.

The current Step 3 specification already provides for slide-over behaviour on narrow viewports. Preserve or improve that behaviour rather than replacing it with fixed-width desktop panels. 

## 12. Do not weaken analytical integrity

These UI changes must not alter the meaning of analytical results.

Do not:

- Invent new analysis findings.
- Convert missing classifications into definitive bands.
- Remove provenance or confidence information.
- Present model inference as deterministic fact.
- Change a computed result merely to match the visual reference.
- Hide uncertainty.
- Replace exact source text with AI paraphrase.
- Make an advisory model output override the deterministic engine.

The existing Step 3 specification requires advisory AI output to remain subordinate to deterministic results and prohibits the advisory model from authoring bands, ranks or verdicts. Preserve this rule. 

## 13. Implementation discipline

Before coding:

1. Inspect the entire referenced design folder and relevant subfolders.
2. Identify the current Step 3 components, styles and state-management flow.
3. Identify whether shared typography, contrast, footer, modal and z-index tokens already exist.
4. Reuse the existing design system wherever practical.
5. Record any conflict between the screenshots, written specifications and current implementation.
6. Follow the written repository specifications when a screenshot is merely illustrative.
7. Do not silently remove an existing capability.

During implementation:

- Make the smallest coherent change set that satisfies the goal.
- Avoid unrelated refactoring.
- Avoid adding a large dependency for a small UI behaviour.
- Use semantic HTML.
- Preserve keyboard operation.
- Preserve automated testability.
- Add or update tests for critical behaviours.

## 14. Required validation

Run or add checks covering:

### Accessibility

- Automated accessibility scan.
- Contrast verification for all changed text tokens.
- Keyboard-only navigation.
- Focus trap and focus restoration for the progress modal.
- Screen-reader labels for panels, progress and actions.
- Red-green colour-blind simulation or equivalent review.
- 200% zoom test.

### Functional

- Step 3 progress modal opens, updates and closes correctly.
- Failure state works.
- Reviewer Comments opens and closes correctly.
- Source-to-comment traceability remains correct.
- Accept and Reject actions remain functional.
- Panel overlap does not break controls.
- Underlying manuscript scroll position is preserved.
- Footer links work.
- API-related production text is removed or clarified.

### Responsive

- Desktop multi-panel layout.
- Narrow slide-over behaviour.
- Mobile full-width behaviour.
- No unintended horizontal scrolling.
- No clipped controls.
- No inaccessible off-screen floating windows.

### Regression

- Existing Step 3 modes continue to work.
- Existing provenance and confidence labels remain accurate.
- Existing manuscript content remains verbatim.
- Existing analysis values remain unchanged unless a separately documented defect is corrected.

/acceptance-criteria

The work is complete only when all of the following are true:

1. The GitHub design folder and relevant subfolders have been reviewed before implementation.
2. The supplied reference images have been used as interaction and layout guidance.
3. The API-related user-facing element has been explained, corrected or removed.
4. The ESCO/ISCO disclaimer is clearly readable without hover or magnification.
5. No important text blends into its background.
6. Red and green are never the sole means of communicating meaning.
7. Changed UI text meets WCAG 2.2 AA contrast requirements.
8. Footer typography is increased by exactly 10% from its former computed size.
9. Footer spacing and wrapping remain usable.
10. Builder, methodology, terms, privacy, accessibility and relevant website information are consolidated in the footer.
11. Context-specific disclaimers remain near the results they qualify.
12. Step 3 analysis progress appears in a centred, accessible modal.
13. The progress modal uses genuine progress or an honest indeterminate state.
14. The progress modal handles success, failure, retry and focus restoration correctly.
15. The manuscript remains the primary evidence surface.
16. Reviewer Comments can appear above the workspace without trapping or permanently hiding essential content.
17. Overlapping panels follow a documented and stable layer hierarchy.
18. Source phrases and reviewer comments remain visibly and semantically traceable.
19. Accept and Reject controls remain explicit, keyboard accessible and not colour-dependent.
20. The interface works across desktop, tablet, mobile, light mode, dark mode and 200% zoom.
21. Analytical results, provenance, confidence and uncertainty are not weakened or misrepresented.
22. Relevant automated and manual tests pass.
23. The implementation summary states:
    - Files changed.
    - Reason for each material change.
    - Accessibility checks performed.
    - Responsive checks performed.
    - Any limitations or unresolved conflicts.
