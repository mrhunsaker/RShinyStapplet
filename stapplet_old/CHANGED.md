# CHANGED.md

This document details the accessibility improvements made to specific HTML files in the `/public_html` folder of this project. These changes were implemented to enhance compliance with Title II of the Americans with Disabilities Act (ADA), as well as the Web Content Accessibility Guidelines (WCAG). The goal is to ensure that all users, including those with disabilities, can access and interact with dynamic content such as plots, tables, and dialogs.

Each change targets improved keyboard navigation, screen reader compatibility, and dynamic content updates. By adding attributes like `tabindex="0"`, `aria-live="polite"`, appropriate `role` values (e.g., `region`, `table`, `dialog`), and descriptive `aria-label`s, the files now better support users who rely on assistive technologies. These modifications address key WCAG success criteria, such as perceivable content, operable interfaces, and understandable regions, and fulfill ADA requirements for effective communication and equal access.

**Scope of Edits:**
No JavaScript files or files in any subfolders of `/public_html` were edited. Only the explicit HTML files listed below were changed. All other files remain unmodified.

This document outlines all accessibility-related changes made to HTML files in the `public_html` folder. Each entry lists the filename, then the line numbers and details of the changes.

---

## /public_html/quant1v_multi_collab.html

- L13-23: Added `ROLE="banner"` to header div.
- L133-139: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Main plot area"` to main plot div.
- L181-188: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Stemplot area"` to stemplot container.
- L190-196: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Normal probability plots"` to normal plots div.
- L197-201: Added `tabindex="0"` and `aria-label="Graph data CSV"` to graph data textarea.
- L217-223: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Summary statistics"` to summary statistics div.
- L232-237: Added `tabindex="0"` and `aria-label="Summary statistics CSV"` to summary statistics textarea.

---

## /public_html/multreg.html

- L26-36: Added `ROLE="banner"` to header div.
- L177-183: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Linear regression model results"` to LSRL results span.
- L185-191: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Residual plot"` to residual plot div.
- L192-198: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Residual dotplot"` to residual dotplot div.
- L200-206: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Prediction controls"` to prediction controls div.
- L213-219: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Prediction result"` to prediction result span.

---

## /public_html/quant1v_single_collab.html

- L27-40: Added `ROLE="banner"` to header div.
- L137-143: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Main plot area"` to plot div.
- L175-181: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Stemplot area"` to stemplot div.
- L224-228: Added `tabindex="0"` and `aria-label="Graph data CSV"` to graph data textarea.
- L244-250: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Summary statistics"` to summary statistics div.
- L259-264: Added `tabindex="0"` and `aria-label="Summary statistics CSV"` to summary statistics textarea.

---

## /public_html/tswift_pt2.html

- L26-36: Added `ROLE="banner"` to header div.
- L65-69: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Simple Random Sample crowd plot"` to SRS crowd plot div.
- L81-85: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Cluster Sample crowd plot"` to cluster crowd plot div.
- L100-104: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Systematic Sample crowd plot"` to systematic crowd plot div.
- L111-119: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Census crowd plot"` to census crowd plot div.
- L120-130: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Teacher Panel Admin Options"` to teacher panel admin options div.

---

## /public_html/tswift_pt1.html

- L26-36: Added `ROLE="banner"` to header div.
- L64-70: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Simple Random Sample crowd plot"` to SRS crowd plot div.
- L80-86: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Stratify by Row crowd plot"` to stratify row crowd plot div.
- L97-103: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Stratify by Column crowd plot"` to stratify column crowd plot div.
- L108-116: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Census crowd plot"` to census crowd plot div.
- L117-127: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Teacher Panel"` to teacher panel div.

---

## /public_html/poisson.html

- L26-36: Added `ROLE="banner"` to header div.
- L97-103: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Poisson distribution plot area"` to plot div.

---

## /public_html/parkinsons.html

- L25-35: Added `ROLE="banner"` to header div.
- L54-57: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Guess icon 1"` to icon 1 div.
- L58-61: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Guess icon 2"` to icon 2 div.
- L62-65: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Guess icon 3"` to icon 3 div.
- L66-69: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Guess icon 4"` to icon 4 div.
- L70-73: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Guess icon 5"` to icon 5 div.
- L74-77: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Guess icon 6"` to icon 6 div.
- L118-121: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Guess icon 7"` to icon 7 div.
- L122-125: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Guess icon 8"` to icon 8 div.
- L126-129: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Guess icon 9"` to icon 9 div.
- L130-133: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Guess icon 10"` to icon 10 div.
- L134-137: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Guess icon 11"` to icon 11 div.
- L138-141: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Guess icon 12"` to icon 12 div.
- L189-205: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Results plot"` to results plot div; similar attributes to dotplot counting options, graph data textarea, and summary statistics span.

---

## /public_html/normal.html

- L26-36: Added `ROLE="banner"` to header div.
- L67-73: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Normal distribution plot area"` to plot div.
- L75-81: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Normal distribution analysis"` to analysis div.

---

## /public_html/prefs_dialog.html

- L46-50: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Preferences plot example"` to preferences plot example div.

---

## /public_html/timberlake_pt1.html

- L26-36: Added `ROLE="banner"` to header div.
- L54-60: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Simple Random Sample crowd plot"` to SRS crowd plot div; similar attributes to SRS plot div.
- L70-76: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Stratify by Row crowd plot"` to stratify row crowd plot div; similar attributes to stratify row plot div.
- L87-93: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Stratify by Column crowd plot"` to stratify column crowd plot div; similar attributes to stratify column plot div.
- L98-106: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Census crowd plot"` to census crowd plot div.
- L107-117: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Teacher Panel"` to teacher panel div.

---

## /public_html/x2dist.html

- L26-36: Added `ROLE="banner"` to header div.
- L62-68: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Chi-squared distribution plot area"` to plot div.
- L71-77: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Chi-squared CDF results"` to CDF results span.
- L133-139: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Chi-squared inverse results"` to inverse results span.
- L174-180: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Chi-squared calculation result"` to calculation result span.

---

## /public_html/sampdist.html

- L26-36: Added `ROLE="banner"` to header div.
- L68-74: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Population plot"` to population plot div.
- L104-110: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="One sample plot"` to one sample plot div.
- L111-117: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="One sample statistics"` to one sample statistics span.
- L160-166: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Sampling distribution plot"` to sampling distribution plot div.
- L167-173: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Sampling distribution statistics"` to sampling distribution statistics span.

---

## /public_html/quant2v_collab.html

- L22-32: Added `ROLE="banner"` to header div.

---

## /public_html/logic_sig.html

- L31-41: Added `ROLE="banner"` to header div.
- L113-119: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Simulation results plot"` to simulation results plot div.
- L120-126: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Dotplot counting options"` to dotplot counting options div.
- L157-162: Added `tabindex="0"` and `aria-label="Simulation graph data CSV"` to simulation graph data textarea.
- L169-175: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Simulation summary statistics"` to simulation summary statistics span.

---

## /public_html/prefs.html

- L21-31: Added `ROLE="banner"` to header div.
- L72-76: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Preferences plot example"` to preferences plot example div.

---

## /public_html/oldfaithful.html

- L26-36: Added `ROLE="banner"` to header div.
- L39-43: Added `ROLE="form"` to form element.
- L58-64: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Population scatterplot"` to population scatterplot div.
- L87-93: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Sample statistics"` to sample statistics span.
- L122-128: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Sampling distribution plot"` to sampling distribution plot div.
- L129-135: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Sampling distribution statistics"` to sampling distribution statistics span.

---

## /public_html/timberlake_pt2.html

- L26-36: Added `ROLE="banner"` to header div.
- L55-61: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Simple Random Sample crowd plot"` to SRS crowd plot div; similar attributes to SRS plot div.
- L71-77: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Cluster Sample crowd plot"` to cluster crowd plot div; similar attributes to cluster plot div.
- L90-96: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Systematic Sample crowd plot"` to systematic crowd plot div; similar attributes to systematic plot div.
- L101-109: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Census crowd plot"` to census crowd plot div.
- L110-120: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Teacher Panel Admin Options"` to teacher panel admin options div.

---

## /public_html/index.html

- L89-95: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Textbook Resources"` to textbook resources header.
- L98-104: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Textbook resource links"` to textbook resource links table.
- L171-177: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Math Medic Resources"` to math medic resources header.

---

## /public_html/streak.html

- L27-37: Added `ROLE="banner"` to header div.
- L126-132: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Streak simulation dotplot"` to streak simulation dotplot div.
- L133-139: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Dotplot counting options"` to dotplot counting options span.

---

## /public_html/sunflowers.html

- L24-34: Added `ROLE="banner"` to header div.
- L80-82: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Sunflowers plot area"` to sunflowers plot area div.

---

## /public_html/tdist.html

- L26-36: Added `ROLE="banner"` to header div.
- L69-75: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="t distribution plot area"` to t distribution plot div.
- L77-83: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="t distribution analysis"` to t distribution analysis div.
- L169-175: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="t calculation result"` to t calculation result span.

---

## /public_html/power.html

- L26-36: Added `ROLE="banner"` to header div.
- L135-141: Added `tabindex="0"`, `aria-live="polite"`, `role="region"`, and `aria-label="Power plot area"` to power plot area div.

---

**Note:**
All changes focused on improving accessibility for keyboard navigation and screen readers, including the addition of `tabindex`, `aria-live`, `role`, and descriptive `aria-label` attributes.
